import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnApplicationBootstrap,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { createSlug } from '../../common/utils/slugify.util';
import {
  CreateFaqCategoryDto,
  UpdateFaqCategoryDto,
} from './dto/faq-category.dto';
import {
  FaqCategory,
  FaqCategoryDocument,
} from './entities/faq-category.entity';
import { Faq, FaqDocument } from './entities/faq.entity';

const NAME_COLLATION = { locale: 'en', strength: 2 };

export interface FaqCategoryWithUsage {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  /** Number of FAQ groups linked to this category */
  usageCount: number;
}

@Injectable()
export class FaqCategoryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(FaqCategoryService.name);

  constructor(
    @InjectModel(FaqCategory.name)
    private readonly categoryModel: Model<FaqCategoryDocument>,
    @InjectModel(Faq.name)
    private readonly faqModel: Model<FaqDocument>,
  ) {}

  /** Idempotent backfill: link FAQ groups that only have a category name. */
  async onApplicationBootstrap() {
    try {
      const groups = await this.faqModel.aggregate<{
        _id: { organizationId: Types.ObjectId; name: string };
      }>([
        { $match: { categoryId: null, category: { $nin: [null, ''] } } },
        {
          $group: {
            _id: { organizationId: '$organizationId', name: '$category' },
          },
        },
      ]);
      for (const g of groups) {
        const cat = await this.findOrCreateByName(
          g._id.organizationId.toString(),
          g._id.name,
        );
        await this.faqModel.updateMany(
          {
            organizationId: g._id.organizationId,
            category: g._id.name,
            categoryId: null,
          },
          { $set: { categoryId: cat._id, category: cat.name } },
        );
      }
      if (groups.length > 0) {
        this.logger.log(
          `FAQ category backfill: ${groups.length} name(s) linked`,
        );
      }
    } catch (err) {
      this.logger.error('FAQ category backfill failed', err as Error);
    }
  }

  async findAll(orgId: string): Promise<FaqCategoryWithUsage[]> {
    const organizationId = new Types.ObjectId(orgId);
    const [categories, usage] = await Promise.all([
      this.categoryModel
        .find({ organizationId })
        .collation(NAME_COLLATION)
        .sort({ name: 1 })
        .lean(),
      this.faqModel.aggregate<{ _id: Types.ObjectId; count: number }>([
        { $match: { organizationId, categoryId: { $ne: null } } },
        { $group: { _id: '$categoryId', count: { $sum: 1 } } },
      ]),
    ]);
    const counts = new Map(usage.map((u) => [u._id.toString(), u.count]));
    return categories.map((c) => ({
      _id: c._id,
      name: c.name,
      slug: c.slug,
      usageCount: counts.get(c._id.toString()) ?? 0,
    }));
  }

  async create(orgId: string, dto: CreateFaqCategoryDto) {
    const organizationId = new Types.ObjectId(orgId);
    const name = this.cleanName(dto.name);
    await this.assertNameAvailable(organizationId, name);
    const slug = await this.uniqueSlug(organizationId, name);
    try {
      return await this.categoryModel.create({ organizationId, name, slug });
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException(`FAQ category "${name}" already exists`);
      }
      throw err;
    }
  }

  /** Rename; linked FAQ groups get the new display name. */
  async update(orgId: string, id: string, dto: UpdateFaqCategoryDto) {
    const organizationId = new Types.ObjectId(orgId);
    const existing = await this.getOwned(organizationId, id);
    if (dto.name === undefined) return existing;

    const name = this.cleanName(dto.name);
    if (name === existing.name) return existing;
    if (name.toLowerCase() !== existing.name.toLowerCase()) {
      await this.assertNameAvailable(organizationId, name, existing._id);
    }

    existing.name = name;
    existing.slug = await this.uniqueSlug(organizationId, name, existing._id);
    try {
      await existing.save();
    } catch (err: any) {
      if (err?.code === 11000) {
        throw new ConflictException(`FAQ category "${name}" already exists`);
      }
      throw err;
    }

    await this.faqModel.updateMany(
      { organizationId, categoryId: existing._id },
      { $set: { category: name } },
    );
    return existing;
  }

  /** Refuses while FAQ groups still use the category. */
  async remove(orgId: string, id: string) {
    const organizationId = new Types.ObjectId(orgId);
    const existing = await this.getOwned(organizationId, id);
    const inUse = await this.faqModel.countDocuments({
      organizationId,
      categoryId: existing._id,
    });
    if (inUse > 0) {
      throw new ConflictException(
        `"${existing.name}" is used by ${inUse} FAQ group(s). Move or delete those groups first.`,
      );
    }
    await existing.deleteOne();
    return existing.toObject();
  }

  /** Used by FaqService on create/update. */
  async resolve(
    orgId: string,
    input: { categoryId?: string; category?: string },
  ): Promise<{ categoryId: Types.ObjectId; category: string } | null> {
    if (input.categoryId) {
      const organizationId = new Types.ObjectId(orgId);
      const cat = await this.getOwned(organizationId, input.categoryId).catch(
        () => null,
      );
      if (!cat) throw new BadRequestException('FAQ category not found');
      return { categoryId: cat._id, category: cat.name };
    }
    if (input.category?.trim()) {
      const cat = await this.findOrCreateByName(orgId, input.category);
      return { categoryId: cat._id, category: cat.name };
    }
    return null;
  }

  // --- helpers ---

  private cleanName(raw: string) {
    const name = raw.replace(/\s+/g, ' ').trim();
    if (!name) throw new BadRequestException('Category name is required');
    return name;
  }

  private async getOwned(organizationId: Types.ObjectId, id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('FAQ category not found');
    }
    const cat = await this.categoryModel.findOne({
      _id: new Types.ObjectId(id),
      organizationId,
    });
    if (!cat) throw new NotFoundException('FAQ category not found');
    return cat;
  }

  private async findOrCreateByName(orgId: string, rawName: string) {
    const organizationId = new Types.ObjectId(orgId);
    const name = this.cleanName(rawName);
    const existing = await this.categoryModel
      .findOne({ organizationId, name })
      .collation(NAME_COLLATION);
    if (existing) return existing;
    const slug = await this.uniqueSlug(organizationId, name);
    try {
      return await this.categoryModel.create({ organizationId, name, slug });
    } catch (err: any) {
      if (err?.code === 11000) {
        const again = await this.categoryModel
          .findOne({ organizationId, name })
          .collation(NAME_COLLATION);
        if (again) return again;
      }
      throw err;
    }
  }

  private async assertNameAvailable(
    organizationId: Types.ObjectId,
    name: string,
    excludeId?: Types.ObjectId,
  ) {
    const filter: FilterQuery<FaqCategoryDocument> = { organizationId, name };
    if (excludeId) filter._id = { $ne: excludeId };
    const clash = await this.categoryModel
      .exists(filter)
      .collation(NAME_COLLATION);
    if (clash) {
      throw new ConflictException(`FAQ category "${name}" already exists`);
    }
  }

  private async uniqueSlug(
    organizationId: Types.ObjectId,
    name: string,
    excludeId?: Types.ObjectId,
  ) {
    const root = createSlug(name) || 'faq-category';
    let slug = root;
    let n = 2;
    for (;;) {
      const filter: FilterQuery<FaqCategoryDocument> = { organizationId, slug };
      if (excludeId) filter._id = { $ne: excludeId };
      if (!(await this.categoryModel.exists(filter))) return slug;
      slug = `${root}-${n++}`;
    }
  }
}

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
import { escapeRegex } from '../../common/utils/escape-regex.util';
import { createSlug } from '../../common/utils/slugify.util';
import {
  Program,
  ProgramDocument,
  ProgramStatus,
} from '../program/entities/program.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './entities/category.entity';

const NAME_COLLATION = { locale: 'en', strength: 2 };

export interface CategoryWithStats {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  isActive: boolean;
  programCount: number;
  coverImage: string;
}

@Injectable()
export class CategoryService implements OnApplicationBootstrap {
  private readonly logger = new Logger(CategoryService.name);

  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
    @InjectModel(Program.name)
    private readonly programModel: Model<ProgramDocument>,
  ) {}

  /**
   * One-time, idempotent backfill: programs created before categories existed
   * only have a `category` name. Create matching Category docs per organization
   * and link them through `categoryId`. Programs already linked are skipped.
   */
  async onApplicationBootstrap() {
    try {
      const groups = await this.programModel.aggregate<{
        _id: { organizationId: Types.ObjectId; name: string };
      }>([
        {
          $match: {
            categoryId: null,
            category: { $nin: [null, ''] },
          },
        },
        {
          $group: {
            _id: { organizationId: '$organizationId', name: '$category' },
          },
        },
      ]);
      if (groups.length === 0) return;

      let linked = 0;
      for (const g of groups) {
        const cat = await this.findOrCreateByName(
          g._id.organizationId.toString(),
          g._id.name,
        );
        const res = await this.programModel.updateMany(
          {
            organizationId: g._id.organizationId,
            category: g._id.name,
            categoryId: null,
          },
          { $set: { categoryId: cat._id, category: cat.name } },
        );
        linked += res.modifiedCount;
      }
      this.logger.log(
        `Category backfill: linked ${linked} program(s) across ${groups.length} category group(s)`,
      );
    } catch (err) {
      this.logger.error('Category backfill failed', err as Error);
    }
  }

  // ---------------------------------------------------------------------------
  // Admin CRUD
  // ---------------------------------------------------------------------------

  async create(orgId: string, dto: CreateCategoryDto): Promise<Category> {
    const organizationId = new Types.ObjectId(orgId);
    const name = dto.name.trim();
    await this.assertNameAvailable(organizationId, name);
    const slug = await this.uniqueSlug(
      organizationId,
      dto.slug || createSlug(name),
    );
    return this.categoryModel.create({
      ...dto,
      name,
      slug,
      organizationId,
    });
  }

  async findAll(
    orgId: string,
    query: { page?: number; limit?: number; search?: string },
  ): Promise<{ data: CategoryWithStats[]; total: number }> {
    const organizationId = new Types.ObjectId(orgId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit) || 50));
    const filter: FilterQuery<CategoryDocument> = { organizationId };
    if (query.search?.trim()) {
      filter.name = {
        $regex: new RegExp(escapeRegex(query.search.trim()), 'i'),
      };
    }

    const [categories, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .collation(NAME_COLLATION)
        .sort({ name: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.categoryModel.countDocuments(filter),
    ]);

    const stats = await this.programStats(
      { organizationId },
      categories.map((c) => c._id),
    );
    return {
      data: categories.map((c) => this.withStats(c, stats)),
      total,
    };
  }

  async findOne(orgId: string, idOrSlug: string): Promise<Category> {
    const category = await this.categoryModel
      .findOne(this.idOrSlugFilter(orgId, idOrSlug))
      .lean();
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(
    orgId: string,
    idOrSlug: string,
    dto: UpdateCategoryDto,
  ): Promise<Category> {
    const organizationId = new Types.ObjectId(orgId);
    const existing = await this.categoryModel.findOne(
      this.idOrSlugFilter(orgId, idOrSlug),
    );
    if (!existing) throw new NotFoundException('Category not found');

    const update: Partial<Category> = { ...dto } as Partial<Category>;
    if (dto.name !== undefined) {
      update.name = dto.name.trim();
      if (update.name.toLowerCase() !== existing.name.toLowerCase()) {
        await this.assertNameAvailable(
          organizationId,
          update.name,
          existing._id,
        );
      }
    }
    if (dto.slug !== undefined && dto.slug !== existing.slug) {
      update.slug = await this.uniqueSlug(
        organizationId,
        dto.slug,
        existing._id,
      );
    }

    const updated = await this.categoryModel.findByIdAndUpdate(
      existing._id,
      { $set: update },
      { new: true },
    );

    // Keep the denormalized program.category name in sync
    if (updated && update.name && update.name !== existing.name) {
      await this.programModel.updateMany(
        { organizationId, categoryId: existing._id },
        { $set: { category: updated.name } },
      );
    }
    return updated as Category;
  }

  async remove(orgId: string, idOrSlug: string): Promise<Category> {
    const organizationId = new Types.ObjectId(orgId);
    const existing = await this.categoryModel.findOne(
      this.idOrSlugFilter(orgId, idOrSlug),
    );
    if (!existing) throw new NotFoundException('Category not found');

    const inUse = await this.programModel.countDocuments({
      organizationId,
      categoryId: existing._id,
    });
    if (inUse > 0) {
      throw new ConflictException(
        `Category is used by ${inUse} program(s). Reassign them before deleting.`,
      );
    }
    await existing.deleteOne();
    return existing.toObject();
  }

  // ---------------------------------------------------------------------------
  // Used by ProgramService
  // ---------------------------------------------------------------------------

  /**
   * Resolve the category for a program write. `categoryId` wins; a bare
   * `category` name (legacy clients) is matched case-insensitively or created.
   * Returns both the reference and the denormalized display name.
   */
  async resolveForProgram(
    orgId: string,
    input: { categoryId?: string; category?: string },
  ): Promise<{ categoryId: Types.ObjectId; category: string } | null> {
    if (input.categoryId) {
      if (!Types.ObjectId.isValid(input.categoryId)) {
        throw new BadRequestException('categoryId must be a valid id');
      }
      const cat = await this.categoryModel
        .findOne({
          _id: new Types.ObjectId(input.categoryId),
          organizationId: new Types.ObjectId(orgId),
        })
        .lean();
      if (!cat) throw new BadRequestException('Category not found');
      return { categoryId: cat._id, category: cat.name };
    }
    if (input.category?.trim()) {
      const cat = await this.findOrCreateByName(orgId, input.category);
      return { categoryId: cat._id, category: cat.name };
    }
    return null;
  }

  // ---------------------------------------------------------------------------
  // Public (website)
  // ---------------------------------------------------------------------------

  /** Active categories that have at least one published program. */
  async findPublic(orgId?: string): Promise<CategoryWithStats[]> {
    const programMatch: FilterQuery<ProgramDocument> = {
      status: ProgramStatus.PUBLISHED,
    };
    if (orgId && Types.ObjectId.isValid(orgId))
      programMatch.organizationId = new Types.ObjectId(orgId);

    const stats = await this.programStats(programMatch);
    if (stats.size === 0) return [];

    const categories = await this.categoryModel
      .find({
        _id: { $in: [...stats.keys()].map((id) => new Types.ObjectId(id)) },
        isActive: true,
      })
      .lean();

    return categories
      .map((c) => this.withStats(c, stats))
      .sort(
        (a, b) =>
          b.programCount - a.programCount || a.name.localeCompare(b.name),
      );
  }

  async findPublicBySlug(
    slug: string,
    orgId?: string,
  ): Promise<CategoryWithStats> {
    const filter: FilterQuery<CategoryDocument> = {
      slug: slug.toLowerCase(),
      isActive: true,
    };
    if (orgId && Types.ObjectId.isValid(orgId))
      filter.organizationId = new Types.ObjectId(orgId);
    const category = await this.categoryModel.findOne(filter).lean();
    if (!category) throw new NotFoundException('Category not found');

    const stats = await this.programStats(
      {
        status: ProgramStatus.PUBLISHED,
        organizationId: category.organizationId,
      },
      [category._id],
    );
    return this.withStats(category, stats);
  }

  /** Lookup used by the public programs filter (`?categorySlug=`). */
  async findIdBySlug(
    slug: string,
    orgId?: string,
  ): Promise<Types.ObjectId | null> {
    const filter: FilterQuery<CategoryDocument> = { slug: slug.toLowerCase() };
    if (orgId && Types.ObjectId.isValid(orgId))
      filter.organizationId = new Types.ObjectId(orgId);
    const cat = await this.categoryModel.findOne(filter).select('_id').lean();
    return cat?._id ?? null;
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Program count + cover image per category. Cover = first hero image of the
   * category's first (oldest) program; falls back to the next program that has one.
   */
  private async programStats(
    match: FilterQuery<ProgramDocument>,
    categoryIds?: Types.ObjectId[],
  ): Promise<Map<string, { count: number; cover: string }>> {
    const $match: FilterQuery<ProgramDocument> = {
      ...match,
      categoryId: categoryIds ? { $in: categoryIds } : { $ne: null },
    };
    const rows = await this.programModel.aggregate<{
      _id: Types.ObjectId;
      count: number;
      covers: (string | null)[];
    }>([
      { $match },
      { $sort: { createdAt: 1 } },
      {
        $group: {
          _id: '$categoryId',
          count: { $sum: 1 },
          covers: { $push: { $arrayElemAt: ['$heroImages', 0] } },
        },
      },
    ]);
    return new Map(
      rows.map((r) => [
        r._id.toString(),
        { count: r.count, cover: r.covers.find((c) => !!c) || '' },
      ]),
    );
  }

  private withStats(
    c: Category & { _id: Types.ObjectId },
    stats: Map<string, { count: number; cover: string }>,
  ): CategoryWithStats {
    const s = stats.get(c._id.toString());
    return {
      _id: c._id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      image: c.image,
      isActive: c.isActive,
      programCount: s?.count ?? 0,
      coverImage: c.image || s?.cover || '',
    };
  }

  private async findOrCreateByName(
    orgId: string,
    rawName: string,
  ): Promise<CategoryDocument> {
    const organizationId = new Types.ObjectId(orgId);
    const name = rawName.trim();
    const existing = await this.categoryModel
      .findOne({ organizationId, name })
      .collation(NAME_COLLATION);
    if (existing) return existing;
    const slug = await this.uniqueSlug(organizationId, createSlug(name));
    try {
      return await this.categoryModel.create({ organizationId, name, slug });
    } catch (err: any) {
      // Concurrent create of the same name: return the winner
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
    const filter: FilterQuery<CategoryDocument> = { organizationId, name };
    if (excludeId) filter._id = { $ne: excludeId };
    const clash = await this.categoryModel
      .exists(filter)
      .collation(NAME_COLLATION);
    if (clash) {
      throw new ConflictException(`Category "${name}" already exists`);
    }
  }

  private async uniqueSlug(
    organizationId: Types.ObjectId,
    base: string,
    excludeId?: Types.ObjectId,
  ): Promise<string> {
    const root = createSlug(base) || 'category';
    let slug = root;
    let n = 2;
    for (;;) {
      const filter: FilterQuery<CategoryDocument> = { organizationId, slug };
      if (excludeId) filter._id = { $ne: excludeId };
      if (!(await this.categoryModel.exists(filter))) return slug;
      slug = `${root}-${n++}`;
    }
  }

  private idOrSlugFilter(
    orgId: string,
    idOrSlug: string,
  ): FilterQuery<CategoryDocument> {
    const organizationId = new Types.ObjectId(orgId);
    return Types.ObjectId.isValid(idOrSlug)
      ? { organizationId, _id: new Types.ObjectId(idOrSlug) }
      : { organizationId, slug: idOrSlug.toLowerCase() };
  }
}

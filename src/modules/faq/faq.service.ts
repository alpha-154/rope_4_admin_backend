import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryBuilder } from '../../common/helpers/mongodb-query-builder.helper';
import { IQueryFeatures } from '../../common/interfaces/query-feature.interface';
import { generateKeyBetween } from '../../utils/fractional-indexing.util';
import { CreateFaqDto } from './dto/create-faq.dto';
import { ReorderFaqDto } from './dto/reorder-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Faq, FaqDocument } from './entities/faq.entity';

@Injectable()
export class FaqService {
  constructor(
    @InjectModel(Faq.name)
    private readonly faqModel: Model<FaqDocument>,
  ) {}

  async create(organizationId: string, createFaqDto: CreateFaqDto) {
    const orgObjId = new Types.ObjectId(organizationId);

    // Compute fractional index before insertion (insert at the beginning or after first)
    const first = await this.faqModel
      .findOne({ organizationId: orgObjId })
      .sort({ index: 'asc' })
      .select({ index: 1 })
      .lean();

    let index: string;
    if (first && (first as any).index) {
      index = generateKeyBetween(null, (first as any).index);
    } else {
      index = generateKeyBetween(null, null);
    }

    const baseSlug = this.slugify(createFaqDto.slug || createFaqDto.category || 'faq');
    const slug = await this.generateUniqueSlug(baseSlug, orgObjId);

    const created = await this.faqModel.create({
      ...createFaqDto,
      index,
      slug,
      organizationId: orgObjId,
    });

    return created;
  }

  async findAll(organizationId: string, query: IQueryFeatures) {
    const queryBuilder = new QueryBuilder(this.faqModel, query, {
      searchFields: ['category', 'faqs.question', 'faqs.answer'] as any,
    });

    if (organizationId) {
      queryBuilder.addFilterQuery({
        organizationId: new Types.ObjectId(organizationId),
      });
    }

    return await queryBuilder.execute();
  }

  async findOne(id: string, organizationId: string) {
    const search: any = { organizationId: new Types.ObjectId(organizationId) };
    if (Types.ObjectId.isValid(id)) {
      search._id = new Types.ObjectId(id);
    } else {
      search.slug = id;
    }

    const faq = await this.faqModel.findOne(search).exec();
    if (!faq) {
      throw new NotFoundException('FAQ group not found');
    }
    return faq;
  }

  async findPublic(organizationId?: string) {
    const filter: any = { isActive: true };
    if (organizationId) {
      filter.organizationId = new Types.ObjectId(organizationId);
    }
    return await this.faqModel.find(filter).sort({ index: 'asc' }).exec();
  }

  async update(id: string, organizationId: string, updateFaqDto: UpdateFaqDto) {
    const search: any = { organizationId: new Types.ObjectId(organizationId) };
    if (Types.ObjectId.isValid(id)) {
      search._id = new Types.ObjectId(id);
    } else {
      search.slug = id;
    }

    if (updateFaqDto.category && !updateFaqDto.slug) {
      updateFaqDto.slug = this.slugify(updateFaqDto.category);
    }

    const updated = await this.faqModel
      .findOneAndUpdate(search, { $set: updateFaqDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('FAQ group not found');
    }
    return updated;
  }

  async reorder(id: string, organizationId: string, payload: ReorderFaqDto) {
    const orgObjId = new Types.ObjectId(organizationId);
    const { prevId, nextId } = payload;

    const existing = await this.faqModel.findOne({
      _id: new Types.ObjectId(id),
      organizationId: orgObjId,
    });
    if (!existing) {
      throw new NotFoundException('FAQ group not found');
    }

    let prevIndex: string | null = null;
    let nextIndex: string | null = null;

    if (prevId) {
      const prev = await this.faqModel
        .findOne({ _id: new Types.ObjectId(prevId), organizationId: orgObjId }, { index: 1 })
        .lean();
      prevIndex = (prev as any)?.index ?? null;
    }

    if (nextId) {
      const next = await this.faqModel
        .findOne({ _id: new Types.ObjectId(nextId), organizationId: orgObjId }, { index: 1 })
        .lean();
      nextIndex = (next as any)?.index ?? null;
    }

    const newIndex = generateKeyBetween(prevIndex, nextIndex);

    const updated = await this.faqModel.findOneAndUpdate(
      { _id: new Types.ObjectId(id), organizationId: orgObjId },
      { index: newIndex },
      { new: true },
    );

    return updated;
  }

  async remove(id: string, organizationId: string) {
    const search: any = { organizationId: new Types.ObjectId(organizationId) };
    if (Types.ObjectId.isValid(id)) {
      search._id = new Types.ObjectId(id);
    } else {
      search.slug = id;
    }

    const deleted = await this.faqModel.findOneAndDelete(search).exec();
    if (!deleted) {
      throw new NotFoundException('FAQ group not found');
    }
    return deleted;
  }

  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  }

  private async generateUniqueSlug(base: string, organizationId: Types.ObjectId): Promise<string> {
    const esc = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const existing = await this.faqModel
      .find(
        {
          organizationId,
          slug: { $regex: new RegExp(`^${esc(base)}(-\\d+)?$`) },
        },
        { slug: 1 },
      )
      .lean();

    if (existing.length === 0) return base;

    let max = 0;
    existing.forEach((e) => {
      const m = e.slug.match(new RegExp(`^${esc(base)}-(\\d+)$`));
      if (m && m[1]) {
        const num = parseInt(m[1], 10);
        if (num > max) max = num;
      }
    });

    return `${base}-${max + 1}`;
  }
}

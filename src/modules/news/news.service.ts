import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { QueryBuilder } from '../../common/helpers/mongodb-query-builder.helper';
import { IQueryFeatures } from '../../common/interfaces/query-feature.interface';
import { CreateNewsDto } from './dto/create-news.dto';
import { QueryPublicNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { News, NewsDocument, NewsStatus } from './entities/news.entity';

@Injectable()
export class NewsService {
  constructor(
    @InjectModel(News.name)
    private readonly newsModel: Model<NewsDocument>,
  ) {}

  async create(organizationId: string, createDto: CreateNewsDto): Promise<News> {
    const orgObjId = new Types.ObjectId(organizationId);
    const baseSlug = createDto.slug || this.slugify(createDto.title);
    const slug = await this.generateUniqueSlug(baseSlug, orgObjId);

    const created = await this.newsModel.create({
      ...createDto,
      slug,
      organizationId: orgObjId,
    });

    return created;
  }

  async findAll(organizationId: string, query: IQueryFeatures) {
    const queryBuilder = new QueryBuilder(this.newsModel, query, {
      searchFields: ['title', 'excerpt', 'type', 'tags'] as any,
    });

    if (organizationId) {
      queryBuilder.addFilterQuery({
        organizationId: new Types.ObjectId(organizationId),
      });
    }

    return await queryBuilder.execute();
  }

  async findOne(id: string, organizationId: string): Promise<News> {
    const search: any = { organizationId: new Types.ObjectId(organizationId) };
    if (Types.ObjectId.isValid(id)) {
      search._id = new Types.ObjectId(id);
    } else {
      search.slug = id;
    }

    const item = await this.newsModel.findOne(search).exec();
    if (!item) {
      throw new NotFoundException('News article not found');
    }
    return item;
  }

  async update(id: string, organizationId: string, updateDto: UpdateNewsDto): Promise<News> {
    const search: any = { organizationId: new Types.ObjectId(organizationId) };
    if (Types.ObjectId.isValid(id)) {
      search._id = new Types.ObjectId(id);
    } else {
      search.slug = id;
    }

    if (updateDto.slug) {
      updateDto.slug = this.slugify(updateDto.slug);
    }

    const updated = await this.newsModel
      .findOneAndUpdate(search, { $set: updateDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('News article not found');
    }
    return updated;
  }

  async remove(id: string, organizationId: string): Promise<News> {
    const search: any = { organizationId: new Types.ObjectId(organizationId) };
    if (Types.ObjectId.isValid(id)) {
      search._id = new Types.ObjectId(id);
    } else {
      search.slug = id;
    }

    const deleted = await this.newsModel.findOneAndDelete(search).exec();
    if (!deleted) {
      throw new NotFoundException('News article not found');
    }
    return deleted;
  }

  // --- PUBLIC ENDPOINTS ---

  async findPublicNews(queryDto: QueryPublicNewsDto) {
    const page = queryDto.page && queryDto.page > 0 ? Number(queryDto.page) : 1;
    const limit = queryDto.limit && queryDto.limit > 0 ? Number(queryDto.limit) : 10;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<NewsDocument> = {
      status: NewsStatus.PUBLISHED,
    };

    if (queryDto.type) {
      filter.type = queryDto.type;
    }

    if (queryDto.tag) {
      filter.tags = { $in: [queryDto.tag] };
    }

    if (typeof queryDto.isFeatured === 'boolean') {
      filter.isFeatured = queryDto.isFeatured;
    }

    if (queryDto.search) {
      const searchRegex = new RegExp(queryDto.search, 'i');
      filter.$or = [
        { title: searchRegex },
        { excerpt: searchRegex },
        { tags: searchRegex },
      ];
    }

    const [items, total] = await Promise.all([
      this.newsModel
        .find(filter)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.newsModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublicNewsBySlug(slug: string): Promise<News> {
    const item = await this.newsModel
      .findOne({ slug, status: NewsStatus.PUBLISHED })
      .lean()
      .exec();

    if (!item) {
      throw new NotFoundException(`Published article with slug "${slug}" not found`);
    }

    return item as unknown as News;
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
    const existing = await this.newsModel
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

import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { escapeRegex } from '../../common/utils/escape-regex.util';
import { Faq, FaqDocument } from '../faq/entities/faq.entity';
import { News, NewsDocument, NewsStatus } from '../news/entities/news.entity';
import {
  Program,
  ProgramDocument,
  ProgramStatus,
} from '../program/entities/program.entity';
import { PublicSearchDto, SearchResultType } from './dto/public-search.dto';

export interface UnifiedSearchItem {
  id: string;
  type: 'program' | 'news' | 'faq';
  title: string;
  slug: string;
  excerpt?: string;
  image?: string;
  badge?: string;
  price?: { amount: number; currency: string };
  difficulty?: string;
  duration?: number;
  country?: string;
  region?: string;
  category?: string;
  location?: { type: string; coordinates: number[] };
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    @InjectModel(Program.name)
    private readonly programModel: Model<ProgramDocument>,
    @InjectModel(News.name)
    private readonly newsModel: Model<NewsDocument>,
    @InjectModel(Faq.name)
    private readonly faqModel: Model<FaqDocument>,
  ) {}

  async search(dto: PublicSearchDto, organizationId?: string) {
    const page = dto.page && dto.page > 0 ? Number(dto.page) : 1;
    const limit = dto.limit && dto.limit > 0 ? Number(dto.limit) : 12;
    const skip = (page - 1) * limit;
    const type = dto.type || SearchResultType.ALL;

    const searchTerm = dto.q ? escapeRegex(dto.q.trim()) : '';
    const searchRegex = searchTerm ? new RegExp(searchTerm, 'i') : null;

    // --- 1. Query Programs ---
    let programs: Program[] = [];
    let programsTotal = 0;

    if (type === SearchResultType.ALL || type === SearchResultType.PROGRAMS) {
      const progFilter: FilterQuery<ProgramDocument> = {
        status: ProgramStatus.PUBLISHED,
      };

      if (organizationId && Types.ObjectId.isValid(organizationId)) {
        progFilter.organizationId = new Types.ObjectId(organizationId);
      }

      if (dto.category) {
        progFilter.category = {
          $regex: new RegExp(`^${escapeRegex(dto.category)}$`, 'i'),
        };
      }
      if (dto.country) {
        progFilter.country = {
          $regex: new RegExp(`^${escapeRegex(dto.country)}$`, 'i'),
        };
      }
      if (dto.difficulty) {
        progFilter.difficulty = {
          $regex: new RegExp(escapeRegex(dto.difficulty), 'i'),
        };
      }
      if (dto.season) {
        progFilter.season = { $in: [new RegExp(escapeRegex(dto.season), 'i')] };
      }
      if (dto.month) {
        progFilter.months = { $in: [new RegExp(escapeRegex(dto.month), 'i')] };
      }

      if (searchRegex) {
        progFilter.$or = [
          { title: searchRegex },
          { shortDescription: searchRegex },
          { country: searchRegex },
          { region: searchRegex },
          { category: searchRegex },
        ];
      }

      let hasNear = false;
      if (dto.near) {
        const parts = dto.near.split(',').map((p) => parseFloat(p.trim()));
        if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          hasNear = true;
          const [lng, lat, maxDistance] = parts;
          progFilter.location = {
            $near: {
              $geometry: { type: 'Point', coordinates: [lng, lat] },
              ...(maxDistance ? { $maxDistance: maxDistance } : {}),
            },
          };
        }
      }

      const countFilter = { ...progFilter };
      if (hasNear && (countFilter.location as any)?.$near) {
        const nearData = (countFilter.location as any).$near;
        const coords = nearData.$geometry.coordinates;
        const maxDistance = nearData.$maxDistance || 500000;
        countFilter.location = {
          $geoWithin: { $centerSphere: [coords, maxDistance / 6378100] },
        } as any;
      }

      const progQuery = this.programModel.find(progFilter);
      if (!hasNear) {
        progQuery.sort({ isFeatured: -1, createdAt: -1 });
      }
      progQuery.skip(skip).limit(limit).lean();

      const [pItems, pCount] = await Promise.all([
        progQuery.exec(),
        this.programModel.countDocuments(countFilter).exec(),
      ]);

      programs = pItems as unknown as Program[];
      programsTotal = pCount;
    }

    // --- 2. Query News / Stories ---
    let newsItems: News[] = [];
    let newsTotal = 0;

    if (type === SearchResultType.ALL || type === SearchResultType.NEWS) {
      const newsFilter: FilterQuery<NewsDocument> = {
        status: NewsStatus.PUBLISHED,
      };

      if (organizationId && Types.ObjectId.isValid(organizationId)) {
        newsFilter.organizationId = new Types.ObjectId(organizationId);
      }

      if (searchRegex) {
        newsFilter.$or = [
          { title: searchRegex },
          { excerpt: searchRegex },
          { tags: searchRegex },
        ];
      }

      const [nItems, nCount] = await Promise.all([
        this.newsModel
          .find(newsFilter)
          .sort({ isFeatured: -1, publishedAt: -1, createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.newsModel.countDocuments(newsFilter).exec(),
      ]);

      newsItems = nItems as unknown as News[];
      newsTotal = nCount;
    }

    // --- 3. Query FAQs ---
    let faqItems: Faq[] = [];
    let faqTotal = 0;

    if (type === SearchResultType.ALL || type === SearchResultType.FAQS) {
      const faqFilter: FilterQuery<FaqDocument> = {
        isActive: true,
      };

      if (organizationId && Types.ObjectId.isValid(organizationId)) {
        faqFilter.organizationId = new Types.ObjectId(organizationId);
      }

      if (searchRegex) {
        faqFilter.$or = [
          { category: searchRegex },
          { 'faqs.question': searchRegex },
          { 'faqs.answer': searchRegex },
        ];
      }

      const [fItems, fCount] = await Promise.all([
        this.faqModel
          .find(faqFilter)
          .sort({ index: 1 })
          .skip(skip)
          .limit(limit)
          .lean()
          .exec(),
        this.faqModel.countDocuments(faqFilter).exec(),
      ]);

      faqItems = fItems as unknown as Faq[];
      faqTotal = fCount;
    }

    // --- 4. Normalized Unified Search Items ---
    const unifiedItems: UnifiedSearchItem[] = [
      ...programs.map((p: any) => ({
        id: p._id.toString(),
        type: 'program' as const,
        title: p.title,
        slug: p.slug,
        excerpt: p.shortDescription,
        image: p.heroImages?.[0] || p.gallery?.[0],
        badge: p.badge,
        price: p.price,
        difficulty: p.difficulty,
        duration: p.duration,
        country: p.country,
        region: p.region,
        category: p.category,
        location: p.location,
      })),
      ...newsItems.map((n: any) => ({
        id: n._id.toString(),
        type: 'news' as const,
        title: n.title,
        slug: n.slug,
        excerpt: n.excerpt,
        image: n.coverImage,
        badge: n.type,
      })),
      ...faqItems.map((f: any) => ({
        id: f._id.toString(),
        type: 'faq' as const,
        title: f.category,
        slug: f.slug,
        excerpt: f.faqs?.[0]?.question ? `Q: ${f.faqs[0].question}` : undefined,
        badge: `${f.faqs?.length || 0} Questions`,
      })),
    ];

    const grandTotal = programsTotal + newsTotal + faqTotal;

    // --- 5. Taxonomies / Facet Aggregation ---
    const taxonomies = await this.getTaxonomies(organizationId);

    return {
      query: dto.q || '',
      type,
      total: grandTotal,
      taxonomies,
      results: {
        programs: {
          items: programs,
          total: programsTotal,
        },
        news: {
          items: newsItems,
          total: newsTotal,
        },
        faqs: {
          items: faqItems,
          total: faqTotal,
        },
      },
      items: unifiedItems,
      meta: {
        page,
        limit,
        totalPages: Math.ceil(grandTotal / limit),
      },
    };
  }

  async getTaxonomies(organizationId?: string) {
    const match: any = { status: ProgramStatus.PUBLISHED };
    if (organizationId && Types.ObjectId.isValid(organizationId)) {
      match.organizationId = new Types.ObjectId(organizationId);
    }

    const [categories, countries, difficulties, seasons, months] =
      await Promise.all([
        this.programModel.aggregate([
          { $match: match },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $match: { _id: { $ne: null } } },
          { $sort: { count: -1 } },
        ]),
        this.programModel.aggregate([
          { $match: match },
          { $group: { _id: '$country', count: { $sum: 1 } } },
          { $match: { _id: { $ne: null } } },
          { $sort: { count: -1 } },
        ]),
        this.programModel.aggregate([
          { $match: match },
          { $group: { _id: '$difficulty', count: { $sum: 1 } } },
          { $match: { _id: { $ne: null } } },
          { $sort: { count: -1 } },
        ]),
        this.programModel.aggregate([
          { $match: match },
          { $unwind: '$season' },
          { $group: { _id: '$season', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
        this.programModel.aggregate([
          { $match: match },
          { $unwind: '$months' },
          { $group: { _id: '$months', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
        ]),
      ]);

    return {
      categories: categories.map((c) => ({ name: c._id, count: c.count })),
      countries: countries.map((c) => ({ name: c._id, count: c.count })),
      difficulties: difficulties.map((d) => ({ name: d._id, count: d.count })),
      seasons: seasons.map((s) => ({ name: s._id, count: s.count })),
      months: months.map((m) => ({ name: m._id, count: m.count })),
    };
  }
}

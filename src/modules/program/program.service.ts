import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { QueryBuilder } from '../../common/helpers/mongodb-query-builder.helper';
import { IQueryFeatures } from '../../common/interfaces/query-feature.interface';
import { escapeRegex } from '../../common/utils/escape-regex.util';
import { sanitizeHtml } from '../../common/utils/sanitize-html.util';
import { CreateProgramDto } from './dto/create-program.dto';
import { QueryPublicProgramsDto } from './dto/query-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import {
  Program,
  ProgramDocument,
  ProgramStatus,
} from './entities/program.entity';

@Injectable()
export class ProgramService {
  constructor(
    @InjectModel(Program.name)
    private readonly programModel: Model<ProgramDocument>,
  ) {}

  async create(
    organizationId: string,
    createDto: CreateProgramDto,
  ): Promise<Program> {
    const orgObjId = new Types.ObjectId(organizationId);
    const baseSlug = createDto.slug || this.slugify(createDto.title);
    const slug = await this.generateUniqueSlug(baseSlug, orgObjId);

    const payload = {
      ...createDto,
      description: createDto.description
        ? sanitizeHtml(createDto.description)
        : createDto.description,
      itinerary: createDto.itinerary?.map((it) => ({
        ...it,
        description: it.description
          ? sanitizeHtml(it.description)
          : it.description,
      })),
    };

    let created: ProgramDocument;
    try {
      created = await this.programModel.create({
        ...payload,
        slug,
        organizationId: orgObjId,
      });
    } catch (err: any) {
      if (err.code === 11000 && err.keyPattern?.slug) {
        const fallbackSlug = `${slug}-${Date.now().toString(36)}`;
        created = await this.programModel.create({
          ...payload,
          slug: fallbackSlug,
          organizationId: orgObjId,
        });
      } else {
        throw err;
      }
    }

    return created;
  }

  async findAll(organizationId: string, query: IQueryFeatures) {
    const queryBuilder = new QueryBuilder(this.programModel, query, {
      searchFields: [
        'title',
        'category',
        'country',
        'region',
        'difficulty',
      ] as any,
    });

    if (organizationId) {
      queryBuilder.addFilterQuery({
        organizationId: new Types.ObjectId(organizationId),
      });
    }

    return await queryBuilder.execute();
  }

  async findOne(id: string, organizationId: string): Promise<Program> {
    const search: any = { organizationId: new Types.ObjectId(organizationId) };
    if (Types.ObjectId.isValid(id)) {
      search._id = new Types.ObjectId(id);
    } else {
      search.slug = id;
    }

    const program = await this.programModel.findOne(search).exec();
    if (!program) {
      throw new NotFoundException('Program not found');
    }
    return program;
  }

  async update(
    id: string,
    organizationId: string,
    updateDto: UpdateProgramDto,
  ): Promise<Program> {
    const search: any = { organizationId: new Types.ObjectId(organizationId) };
    if (Types.ObjectId.isValid(id)) {
      search._id = new Types.ObjectId(id);
    } else {
      search.slug = id;
    }

    if (updateDto.slug) {
      updateDto.slug = this.slugify(updateDto.slug);
    }

    if (updateDto.description) {
      updateDto.description = sanitizeHtml(updateDto.description);
    }
    if (updateDto.itinerary) {
      updateDto.itinerary = updateDto.itinerary.map((it) => ({
        ...it,
        description: it.description
          ? sanitizeHtml(it.description)
          : it.description,
      }));
    }

    const updated = await this.programModel
      .findOneAndUpdate(search, { $set: updateDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Program not found');
    }
    return updated;
  }

  async remove(id: string, organizationId: string): Promise<Program> {
    const search: any = { organizationId: new Types.ObjectId(organizationId) };
    if (Types.ObjectId.isValid(id)) {
      search._id = new Types.ObjectId(id);
    } else {
      search.slug = id;
    }

    const deleted = await this.programModel.findOneAndDelete(search).exec();
    if (!deleted) {
      throw new NotFoundException('Program not found');
    }
    return deleted;
  }

  // --- PUBLIC ENDPOINTS (WEBSITE) ---

  async findPublicPrograms(
    queryDto: QueryPublicProgramsDto,
    organizationId?: string,
  ) {
    const page = queryDto.page && queryDto.page > 0 ? Number(queryDto.page) : 1;
    const limit =
      queryDto.limit && queryDto.limit > 0 ? Number(queryDto.limit) : 10;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<ProgramDocument> = {
      status: ProgramStatus.PUBLISHED,
    };

    if (organizationId) {
      filter.organizationId = new Types.ObjectId(organizationId);
    }

    if (queryDto.category) {
      filter.category = {
        $regex: new RegExp(`^${escapeRegex(queryDto.category)}$`, 'i'),
      };
    }

    if (queryDto.country) {
      filter.country = {
        $regex: new RegExp(`^${escapeRegex(queryDto.country)}$`, 'i'),
      };
    }

    if (queryDto.region) {
      filter.region = {
        $regex: new RegExp(`^${escapeRegex(queryDto.region)}$`, 'i'),
      };
    }

    if (queryDto.difficulty) {
      filter.difficulty = {
        $regex: new RegExp(escapeRegex(queryDto.difficulty), 'i'),
      };
    }

    if (queryDto.season) {
      filter.season = { $in: [new RegExp(escapeRegex(queryDto.season), 'i')] };
    }

    if (queryDto.month) {
      filter.months = { $in: [new RegExp(escapeRegex(queryDto.month), 'i')] };
    }

    if (typeof queryDto.isFeatured === 'boolean') {
      filter.isFeatured = queryDto.isFeatured;
    }

    if (
      queryDto.minDuration !== undefined ||
      queryDto.maxDuration !== undefined
    ) {
      filter.duration = {};
      if (queryDto.minDuration !== undefined)
        filter.duration.$gte = Number(queryDto.minDuration);
      if (queryDto.maxDuration !== undefined)
        filter.duration.$lte = Number(queryDto.maxDuration);
    }

    if (queryDto.minPrice !== undefined || queryDto.maxPrice !== undefined) {
      filter['price.amount'] = {};
      if (queryDto.minPrice !== undefined)
        filter['price.amount'].$gte = Number(queryDto.minPrice);
      if (queryDto.maxPrice !== undefined)
        filter['price.amount'].$lte = Number(queryDto.maxPrice);
    }

    if (queryDto.search) {
      const searchRegex = new RegExp(escapeRegex(queryDto.search), 'i');
      filter.$or = [
        { title: searchRegex },
        { shortDescription: searchRegex },
        { country: searchRegex },
        { region: searchRegex },
        { category: searchRegex },
      ];
    }

    // Geospatial search if 'near' query supplied: "lng,lat,maxDistanceMeters"
    let hasNearQuery = false;
    if (queryDto.near) {
      const parts = queryDto.near.split(',').map((p) => parseFloat(p.trim()));
      if (parts.length >= 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
        hasNearQuery = true;
        const [lng, lat, maxDistance] = parts;
        filter.location = {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [lng, lat],
            },
            ...(maxDistance ? { $maxDistance: maxDistance } : {}),
          },
        };
      }
    }

    // Build sort
    const sort: Record<string, 1 | -1> = {};
    if (queryDto.sort) {
      const sortField = queryDto.sort.startsWith('-')
        ? queryDto.sort.slice(1)
        : queryDto.sort;
      const sortDirection = queryDto.sort.startsWith('-') ? -1 : 1;

      if (sortField === 'price') {
        sort['price.amount'] = sortDirection;
      } else {
        sort[sortField] = sortDirection;
      }
    } else if (!hasNearQuery) {
      // MongoDB requires $near to define the sort order; only apply createdAt sort if not using $near
      sort.createdAt = -1;
    }

    // Clone filter for countDocuments without $near (MongoDB countDocuments does not support $near)
    const countFilter: FilterQuery<ProgramDocument> = { ...filter };
    if (hasNearQuery && (countFilter.location as any)?.$near) {
      const nearData = (countFilter.location as any).$near;
      const coords = nearData.$geometry.coordinates;
      const maxDistance = nearData.$maxDistance || 500000;
      countFilter.location = {
        $geoWithin: {
          $centerSphere: [coords, maxDistance / 6378100],
        },
      } as any;
    }

    const [items, total] = await Promise.all([
      this.programModel
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.programModel.countDocuments(countFilter).exec(),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findPublicProgramBySlug(
    slug: string,
    organizationId?: string,
  ): Promise<Program> {
    const filter: FilterQuery<ProgramDocument> = {
      slug,
      status: ProgramStatus.PUBLISHED,
    };
    if (organizationId) {
      filter.organizationId = new Types.ObjectId(organizationId);
    }
    const program = await this.programModel.findOne(filter).lean().exec();

    if (!program) {
      throw new NotFoundException(
        `Published program with slug "${slug}" not found`,
      );
    }

    return program as unknown as Program;
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

  private async generateUniqueSlug(
    base: string,
    organizationId: Types.ObjectId,
  ): Promise<string> {
    const esc = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const existing = await this.programModel
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

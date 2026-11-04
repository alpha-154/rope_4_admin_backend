import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { QueryBuilder } from '../../common/helpers/mongodb-query-builder.helper';
import { IQueryFeatures } from '../../common/interfaces/query-feature.interface';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { Highlight, HighlightDocument } from './entities/highlight.entity';

@Injectable()
export class HighlightService {
  constructor(
    @InjectModel(Highlight.name)
    private readonly highlightModel: Model<HighlightDocument>,
  ) {}

  async create(organizationId: string, createDto: CreateHighlightDto) {
    const slug = createDto.slug || this.slugify(createDto.sectionKey);
    const highlight = await this.highlightModel.create({
      ...createDto,
      slug,
      organizationId: new Types.ObjectId(organizationId),
    });
    return highlight;
  }

  async findAll(organizationId: string, query: IQueryFeatures) {
    const queryBuilder = new QueryBuilder(this.highlightModel, query, {
      searchFields: ['sectionKey', 'slug', 'badge', 'sectionTitle'],
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

    const highlight = await this.highlightModel.findOne(search).exec();
    if (!highlight) {
      throw new NotFoundException('Highlight section not found');
    }
    return highlight;
  }

  async findPublic(sectionKeyOrSlug: string, organizationId?: string) {
    const filter: any = {
      $or: [{ slug: sectionKeyOrSlug }, { sectionKey: sectionKeyOrSlug }],
      isActive: true,
      isPublic: true,
    };
    if (organizationId) {
      filter.organizationId = new Types.ObjectId(organizationId);
    }
    const highlight = await this.highlightModel.findOne(filter).exec();
    if (!highlight) {
      throw new NotFoundException('Highlight section not found');
    }
    return highlight;
  }

  async update(
    id: string,
    organizationId: string,
    updateDto: UpdateHighlightDto,
  ) {
    const search: any = { organizationId: new Types.ObjectId(organizationId) };
    if (Types.ObjectId.isValid(id)) {
      search._id = new Types.ObjectId(id);
    } else {
      search.slug = id;
    }

    const updated = await this.highlightModel
      .findOneAndUpdate(search, { $set: updateDto }, { new: true })
      .exec();

    if (!updated) {
      throw new NotFoundException('Highlight section not found');
    }
    return updated;
  }

  async remove(id: string, organizationId: string) {
    const search: any = { organizationId: new Types.ObjectId(organizationId) };
    if (Types.ObjectId.isValid(id)) {
      search._id = new Types.ObjectId(id);
    } else {
      search.slug = id;
    }

    const deleted = await this.highlightModel.findOneAndDelete(search).exec();
    if (!deleted) {
      throw new NotFoundException('Highlight section not found');
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
}

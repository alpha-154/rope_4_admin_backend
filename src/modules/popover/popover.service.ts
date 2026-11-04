import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { QueryBuilder } from '../../common/helpers/mongodb-query-builder.helper';
import { IQueryFeatures } from '../../common/interfaces/query-feature.interface';
import { CreatePopoverDto } from './dto/create-popover.dto';
import { UpdatePopoverDto } from './dto/update-popover.dto';
import { Popover, PopoverDocument } from './entities/popover.entity';

@Injectable()
export class PopoverService {
  constructor(
    @InjectModel(Popover.name)
    private readonly popoverModel: Model<PopoverDocument>,
  ) {}

  async create(
    organizationId: string,
    createDto: CreatePopoverDto,
  ): Promise<Popover> {
    const created = await this.popoverModel.create({
      ...createDto,
      organizationId: new Types.ObjectId(organizationId),
    });
    return created;
  }

  async findAll(organizationId: string, query: IQueryFeatures) {
    const queryBuilder = new QueryBuilder(this.popoverModel, query, {
      searchFields: ['title', 'body', 'type', 'pageTargeting'] as any,
    });

    if (organizationId) {
      queryBuilder.addFilterQuery({
        organizationId: new Types.ObjectId(organizationId),
      });
    }

    return await queryBuilder.execute();
  }

  async findOne(id: string, organizationId: string): Promise<Popover> {
    const popover = await this.popoverModel
      .findOne({
        _id: new Types.ObjectId(id),
        organizationId: new Types.ObjectId(organizationId),
      })
      .exec();

    if (!popover) {
      throw new NotFoundException('Popover not found');
    }
    return popover;
  }

  async update(
    id: string,
    organizationId: string,
    updateDto: UpdatePopoverDto,
  ): Promise<Popover> {
    const updated = await this.popoverModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        },
        { $set: updateDto },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Popover not found');
    }
    return updated;
  }

  async remove(id: string, organizationId: string): Promise<Popover> {
    const deleted = await this.popoverModel
      .findOneAndDelete({
        _id: new Types.ObjectId(id),
        organizationId: new Types.ObjectId(organizationId),
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Popover not found');
    }
    return deleted;
  }

  // --- PUBLIC ENDPOINTS ---

  async findActivePopovers(page?: string, organizationId?: string) {
    const now = new Date();
    const filter: FilterQuery<PopoverDocument> = {
      isActive: true,
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
    };

    if (organizationId && Types.ObjectId.isValid(organizationId)) {
      filter.organizationId = new Types.ObjectId(organizationId);
    }

    if (page) {
      filter.$or = [{ pageTargeting: 'all' }, { pageTargeting: page }];
    }

    return await this.popoverModel
      .find(filter)
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }
}

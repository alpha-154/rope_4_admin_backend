import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { QueryBuilder } from '../../common/helpers/mongodb-query-builder.helper';
import { IQueryFeatures } from '../../common/interfaces/query-feature.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryPublicReviewsDto } from './dto/query-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review, ReviewDocument, ReviewStatus } from './entities/review.entity';

@Injectable()
export class ReviewService {
  constructor(
    @InjectModel(Review.name)
    private readonly reviewModel: Model<ReviewDocument>,
  ) {}

  async create(
    organizationId: string,
    createDto: CreateReviewDto,
  ): Promise<Review> {
    const payload: any = {
      ...createDto,
      organizationId: new Types.ObjectId(organizationId),
    };
    if (createDto.programId && Types.ObjectId.isValid(createDto.programId)) {
      payload.programId = new Types.ObjectId(createDto.programId);
    }
    return await this.reviewModel.create(payload);
  }

  async findAll(organizationId: string, query: IQueryFeatures) {
    const queryBuilder = new QueryBuilder(this.reviewModel, query, {
      searchFields: ['author', 'text', 'source', 'programTitle'] as any,
    });

    if (organizationId) {
      queryBuilder.addFilterQuery({
        organizationId: new Types.ObjectId(organizationId),
      });
    }

    return await queryBuilder.execute();
  }

  async findOne(id: string, organizationId: string): Promise<Review> {
    const review = await this.reviewModel
      .findOne({
        _id: new Types.ObjectId(id),
        organizationId: new Types.ObjectId(organizationId),
      })
      .exec();

    if (!review) {
      throw new NotFoundException('Review not found');
    }
    return review;
  }

  async update(
    id: string,
    organizationId: string,
    updateDto: UpdateReviewDto,
  ): Promise<Review> {
    const payload: any = { ...updateDto };
    if (updateDto.programId && Types.ObjectId.isValid(updateDto.programId)) {
      payload.programId = new Types.ObjectId(updateDto.programId);
    }

    const updated = await this.reviewModel
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(id),
          organizationId: new Types.ObjectId(organizationId),
        },
        { $set: payload },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new NotFoundException('Review not found');
    }
    return updated;
  }

  async remove(id: string, organizationId: string): Promise<Review> {
    const deleted = await this.reviewModel
      .findOneAndDelete({
        _id: new Types.ObjectId(id),
        organizationId: new Types.ObjectId(organizationId),
      })
      .exec();

    if (!deleted) {
      throw new NotFoundException('Review not found');
    }
    return deleted;
  }

  // --- PUBLIC ENDPOINTS ---

  async findPublic(queryDto: QueryPublicReviewsDto, organizationId?: string) {
    const page = queryDto.page && queryDto.page > 0 ? Number(queryDto.page) : 1;
    const limit =
      queryDto.limit && queryDto.limit > 0 ? Number(queryDto.limit) : 10;
    const skip = (page - 1) * limit;

    const filter: FilterQuery<ReviewDocument> = {
      status: ReviewStatus.APPROVED,
    };

    if (organizationId && Types.ObjectId.isValid(organizationId)) {
      filter.organizationId = new Types.ObjectId(organizationId);
    }

    if (queryDto.source) {
      filter.source = queryDto.source;
    }

    if (queryDto.programId && Types.ObjectId.isValid(queryDto.programId)) {
      filter.programId = new Types.ObjectId(queryDto.programId);
    }

    if (typeof queryDto.isFeatured === 'boolean') {
      filter.isFeatured = queryDto.isFeatured;
    }

    const [items, total] = await Promise.all([
      this.reviewModel
        .find(filter)
        .sort({ order: 1, date: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.reviewModel.countDocuments(filter).exec(),
    ]);

    return {
      data: items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getAggregateRating(organizationId?: string) {
    const match: any = { status: ReviewStatus.APPROVED };
    if (organizationId && Types.ObjectId.isValid(organizationId)) {
      match.organizationId = new Types.ObjectId(organizationId);
    }

    const stats = await this.reviewModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          averageRating: { $avg: '$rating' },
          totalReviews: { $sum: 1 },
          star5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
          star1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
        },
      },
    ]);

    if (!stats || stats.length === 0) {
      return {
        averageRating: 5.0,
        totalReviews: 0,
        ratingBreakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      };
    }

    const res = stats[0];
    return {
      averageRating: Math.round(res.averageRating * 10) / 10,
      totalReviews: res.totalReviews,
      ratingBreakdown: {
        5: res.star5,
        4: res.star4,
        3: res.star3,
        2: res.star2,
        1: res.star1,
      },
    };
  }
}

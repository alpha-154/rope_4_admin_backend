import { FilterQuery, Model, PipelineStage } from 'mongoose';
import { escapeRegex } from '../utils/escape-regex.util';
import { IQueryFeatures } from '../interfaces/query-feature.interface';

interface IOptions<T> {
  searchFields?: (keyof T)[];
}

export class QueryBuilder<T> {
  private queryParams: IQueryFeatures;
  private pipeline: PipelineStage[] = [];
  private extraPipes: PipelineStage[] = [];
  private filterQuery: FilterQuery<T> = {};
  private searchFields: (keyof T)[] = [];
  private model: Model<T>;

  constructor(
    model: Model<T>,
    queryParams: IQueryFeatures,
    options?: IOptions<T>,
  ) {
    this.model = model;
    this.queryParams = queryParams;
    if (options?.searchFields) {
      this.searchFields = options.searchFields;
    }
  }

  addFilterQuery(filterQuery: FilterQuery<T>) {
    this.filterQuery = { ...this.filterQuery, ...filterQuery };
    return this;
  }

  addExtraPipes(extras: PipelineStage[]) {
    this.extraPipes = [...this.extraPipes, ...extras];
    return this;
  }

  addCustomStage(stage: PipelineStage) {
    this.pipeline.push(stage);
    return this;
  }

  private buildMatchStage(): PipelineStage.Match | null {
    const filters = {
      ...(this.queryParams.filters || {}),
      ...this.filterQuery,
    };
    const andConditions: any[] = [];

    if (Object.keys(filters).length > 0) {
      andConditions.push(filters);
    }

    if (this.queryParams.search && this.searchFields.length > 0) {
      const safeSearch = escapeRegex(this.queryParams.search);
      const searchConditions = this.searchFields.map((field) => ({
        [field]: {
          $regex: safeSearch,
          $options: 'i',
        },
      }));
      andConditions.push({ $or: searchConditions });
    }

    if (andConditions.length === 0) {
      return null;
    }

    return {
      $match:
        andConditions.length === 1 ? andConditions[0] : { $and: andConditions },
    };
  }

  private buildSortStage(): PipelineStage.Sort {
    return {
      $sort: this.queryParams.sort || { createdAt: -1 },
    };
  }

  private buildProjectStage(): PipelineStage.Project | PipelineStage.AddFields {
    return this.queryParams.fields &&
      Object.keys(this.queryParams.fields).length > 0
      ? { $project: this.queryParams.fields }
      : { $addFields: {} };
  }

  private buildPagination(): PipelineStage[] {
    const skip = this.queryParams.skip ?? 0;
    const limit = this.queryParams.limit ?? 10;
    return [{ $skip: skip }, { $limit: limit }];
  }

  async execute(): Promise<{ data: T[]; total: number }> {
    const matchStage = this.buildMatchStage();
    const sortStage = this.buildSortStage();
    const projectStage = this.buildProjectStage();
    const pagination = this.buildPagination();

    if (matchStage) this.pipeline.push(matchStage);
    this.pipeline.push(sortStage);
    this.pipeline.push(projectStage);
    this.pipeline.push({
      $facet: {
        data: [...pagination, ...this.extraPipes] as any,
        total: [{ $count: 'total' }],
      },
    });
    this.pipeline.push({
      $project: {
        total: { $ifNull: [{ $arrayElemAt: ['$total.total', 0] }, 0] },
        data: 1,
      },
    });

    const [result] = await this.model.aggregate(this.pipeline).exec();
    return {
      data: result?.data || [],
      total: result?.total || 0,
    };
  }
}

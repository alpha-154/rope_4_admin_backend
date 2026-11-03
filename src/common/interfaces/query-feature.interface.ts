export interface IQueryFeatures {
  page?: number;
  limit?: number;
  skip?: number;
  fields?: { [key: string]: number };
  filters?: { [key: string]: any };
  sort?: { [key: string]: -1 | 1 };
  search?: string;
  populate?: any;
}

export interface IQueryResult<T> {
  data: Partial<T>[];
  total: number;
}

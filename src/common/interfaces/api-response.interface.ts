export interface IApiResponse<T = undefined> {
  success: boolean;
  message: string | null | string[];
  path?: string;
  errors?: any;
  stack?: any;
  meta?: {
    page: number;
    limit: number | undefined;
    total: number;
    totalPage?: number | undefined;
  };
  data?: T | null;
}

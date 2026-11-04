export interface UploadedFileResponse {
  filename: string;
  originalName: string;
  url: string;
  size: number;
  mimetype: string;
}

export interface IStorageService {
  upload(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadedFileResponse>;
  delete(filename: string): Promise<void>;
  getUrl(filename: string): string;
}

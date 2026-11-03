import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { EnvironmentKey } from '@/config';
import { IStorageService, UploadedFileResponse } from './storage.interface';

@Injectable()
export class LocalStorageService implements IStorageService {
  private readonly logger = new Logger(LocalStorageService.name);
  private readonly uploadDir: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.uploadDir = path.resolve(
      this.configService.get<string>(EnvironmentKey.UPLOAD_DIR) || './uploads',
    );
    this.baseUrl =
      this.configService.get<string>('BASE_URL') ||
      `http://localhost:${this.configService.get<number>(EnvironmentKey.PORT) || 5001}`;

    // Ensure uploads root directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(
    file: Express.Multer.File,
    folder = 'general',
  ): Promise<UploadedFileResponse> {
    const targetDir = path.join(this.uploadDir, folder);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${cleanBaseName}-${Date.now()}${ext}`;
    const targetFilePath = path.join(targetDir, uniqueFilename);

    await fs.promises.writeFile(targetFilePath, file.buffer);

    const relativePath = path.join(folder, uniqueFilename).replace(/\\/g, '/');
    const url = `${this.baseUrl}/uploads/${relativePath}`;

    this.logger.log(`Uploaded file stored at ${targetFilePath} -> ${url}`);

    return {
      filename: uniqueFilename,
      originalName: file.originalname,
      url,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  async delete(relativePath: string): Promise<void> {
    const filePath = path.join(this.uploadDir, relativePath);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
      this.logger.log(`Deleted file at ${filePath}`);
    }
  }

  getUrl(relativePath: string): string {
    const cleanPath = relativePath.replace(/\\/g, '/');
    return `${this.baseUrl}/uploads/${cleanPath}`;
  }
}

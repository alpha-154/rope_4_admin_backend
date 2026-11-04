import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { EnvironmentKey } from '@/config';
import { IStorageService, UploadedFileResponse } from './storage.interface';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/svg+xml',
  'image/gif',
  'image/avif',
  'application/pdf',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
  '.svg',
  '.gif',
  '.avif',
  '.pdf',
]);

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
    const ext = path.extname(file.originalname).toLowerCase();
    if (
      !ALLOWED_EXTENSIONS.has(ext) ||
      !ALLOWED_MIME_TYPES.has(file.mimetype.toLowerCase())
    ) {
      throw new BadRequestException(
        `File type "${file.mimetype}" or extension "${ext}" is not supported. Allowed formats: JPG, PNG, WEBP, SVG, GIF, PDF.`,
      );
    }

    // Sanitize folder to prevent path traversal
    const safeFolder =
      folder
        .replace(/[^a-zA-Z0-9_\-\/]/g, '')
        .replace(/\.\.+/g, '')
        .replace(/^\/+|\/+$/g, '') || 'general';

    const targetDir = path.resolve(this.uploadDir, safeFolder);
    if (!targetDir.startsWith(this.uploadDir)) {
      throw new BadRequestException('Invalid folder path');
    }

    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const cleanBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueFilename = `${cleanBaseName}-${Date.now()}${ext}`;
    const targetFilePath = path.join(targetDir, uniqueFilename);

    await fs.promises.writeFile(targetFilePath, file.buffer);

    const relativePath = path
      .join(safeFolder, uniqueFilename)
      .replace(/\\/g, '/');
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
    const resolvedPath = path.resolve(this.uploadDir, relativePath);
    if (!resolvedPath.startsWith(this.uploadDir)) {
      throw new BadRequestException('Invalid file path for deletion');
    }

    if (fs.existsSync(resolvedPath)) {
      await fs.promises.unlink(resolvedPath);
      this.logger.log(`Deleted file at ${resolvedPath}`);
    }
  }

  getUrl(relativePath: string): string {
    const cleanPath = relativePath.replace(/\\/g, '/');
    return `${this.baseUrl}/uploads/${cleanPath}`;
  }
}

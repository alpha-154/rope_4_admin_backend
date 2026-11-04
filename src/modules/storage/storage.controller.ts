import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Post,
  Query,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@/common/guards/auth.guard';
import { LocalStorageService } from './local-storage.service';

@ApiTags('Storage')
@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('admin/storage')
export class StorageController {
  constructor(private readonly storageService: LocalStorageService) {}

  @Post('upload')
  @ApiOperation({ summary: 'Upload single file / image' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'folder', required: false, example: 'programs' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') queryFolder?: string,
    @Body('folder') bodyFolder?: string,
  ) {
    if (!file) {
      throw new BadRequestException('No file provided for upload');
    }
    const folder = bodyFolder || queryFolder || 'general';
    return this.storageService.upload(file, folder);
  }

  @Post('upload-multiple')
  @ApiOperation({ summary: 'Upload multiple files / images' })
  @ApiConsumes('multipart/form-data')
  @ApiQuery({ name: 'folder', required: false, example: 'gallery' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
      },
    },
  })
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
    }),
  )
  async uploadFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Query('folder') queryFolder?: string,
    @Body('folder') bodyFolder?: string,
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }
    const folder = bodyFolder || queryFolder || 'general';
    const uploaded = await Promise.all(
      files.map((f) => this.storageService.upload(f, folder)),
    );
    return uploaded;
  }

  @Delete('file')
  @ApiOperation({ summary: 'Delete file by relative path' })
  @ApiQuery({
    name: 'path',
    required: true,
    example: 'programs/keokradong.jpg',
  })
  async deleteFile(@Query('path') filePath: string) {
    if (!filePath) {
      throw new BadRequestException('File path is required');
    }
    await this.storageService.delete(filePath);
    return { message: 'File deleted successfully' };
  }
}

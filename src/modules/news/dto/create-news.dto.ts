import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { NewsSeo, NewsStatus, NewsType } from '../entities/news.entity';

export class CreateNewsDto {
  @ApiPropertyOptional({ enum: NewsType, default: NewsType.ARTICLE })
  @IsOptional()
  @IsEnum(NewsType)
  type?: NewsType;

  @ApiProperty({ example: 'Essential Gear for Winter Himalayan Expeditions' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: 'essential-gear-for-winter-himalayan-expeditions',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: '/uploads/news/cover.jpg' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({
    example: 'A complete rundown of layers and sub-zero mountaineering gear.',
  })
  @IsNotEmpty()
  @IsString()
  excerpt: string;

  @ApiPropertyOptional({
    example: '<p>Comprehensive article body in HTML...</p>',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=xyz' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ type: [String], example: ['gear', 'winter'] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  publishedAt?: Date;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ enum: NewsStatus, default: NewsStatus.DRAFT })
  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;

  @ApiPropertyOptional({ type: NewsSeo })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewsSeo)
  seo?: NewsSeo;
}

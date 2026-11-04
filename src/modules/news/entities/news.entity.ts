import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose, { Document } from 'mongoose';
import { Organization } from '../../organization/entities/organization.entity';

export type NewsDocument = News & Document;

export enum NewsType {
  ARTICLE = 'article',
  UPDATE = 'update',
  VIDEO = 'video',
}

export enum NewsStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

@Schema({ _id: false })
export class NewsSeo {
  @ApiPropertyOptional({ example: 'Winter Trekking Guide 2026 | Rope4' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ example: 'Complete beginner preparation guide for Himalayan high-altitude summits.' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '/uploads/news/og-winter-guide.jpg' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  ogImage?: string;
}

export const NewsSeoSchema = SchemaFactory.createForClass(NewsSeo);

@Schema({
  timestamps: true,
  collection: 'news',
  toJSON: { virtuals: true },
})
export class News {
  @ApiProperty({ description: 'Organization reference' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  @IsMongoId()
  organizationId: string;

  @ApiProperty({ enum: NewsType, default: NewsType.ARTICLE })
  @Prop({
    type: String,
    enum: NewsType,
    default: NewsType.ARTICLE,
    index: true,
  })
  @IsEnum(NewsType)
  type: NewsType;

  @ApiProperty({ example: 'Essential Gear for Winter Himalayan Expeditions' })
  @Prop({ type: String, required: true, trim: true, index: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'essential-gear-for-winter-himalayan-expeditions' })
  @Prop({ type: String, required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: '/uploads/news/cover.jpg' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  cover?: string;

  @ApiProperty({ example: 'A complete rundown of layers, mountaineering boots, and sleep systems that withstand sub-zero winds.' })
  @Prop({ type: String, required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  excerpt: string;

  @ApiPropertyOptional({ example: '<p>Comprehensive article body in HTML...</p>' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=xyz' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ type: [String], example: ['gear', 'winter', 'himalayas'] })
  @Prop({ type: [String], default: [] })
  @IsArray()
  tags: string[];

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z' })
  @Prop({ type: Date, default: Date.now, index: true })
  @IsOptional()
  publishedAt: Date;

  @ApiPropertyOptional({ example: true, default: false })
  @Prop({ type: Boolean, default: false, index: true })
  @IsOptional()
  @IsBoolean()
  isFeatured: boolean;

  @ApiProperty({ enum: NewsStatus, default: NewsStatus.DRAFT })
  @Prop({
    type: String,
    enum: NewsStatus,
    default: NewsStatus.DRAFT,
    index: true,
  })
  @IsEnum(NewsStatus)
  status: NewsStatus;

  @ApiPropertyOptional({ type: NewsSeo })
  @Prop({ type: NewsSeoSchema, default: () => ({}) })
  @IsOptional()
  @ValidateNested()
  @Type(() => NewsSeo)
  seo?: NewsSeo;
}

export const NewsSchema = SchemaFactory.createForClass(News);

NewsSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
NewsSchema.index({ organizationId: 1, status: 1, type: 1, publishedAt: -1 });
NewsSchema.index({ title: 'text', excerpt: 'text', tags: 'text' });

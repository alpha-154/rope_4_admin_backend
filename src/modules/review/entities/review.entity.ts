import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import mongoose, { Document } from 'mongoose';
import { Organization } from '../../organization/entities/organization.entity';
import { Program } from '../../program/entities/program.entity';

export type ReviewDocument = Review & Document;

export enum ReviewStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({
  timestamps: true,
  collection: 'reviews',
  toJSON: { virtuals: true },
})
export class Review {
  @ApiProperty({ description: 'Organization reference' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  @IsMongoId()
  organizationId: string;

  @ApiProperty({ example: 'Tahsin Ahmed', description: 'Review author name' })
  @Prop({ type: String, required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  author: string;

  @ApiPropertyOptional({ example: '/uploads/avatars/user1.jpg' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 5, description: 'Rating score from 1 to 5' })
  @Prop({ type: Number, required: true, min: 1, max: 5, index: true })
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: '2026-10-15', description: 'Date of review' })
  @Prop({ type: Date, default: Date.now })
  @IsOptional()
  date: Date;

  @ApiProperty({
    example:
      'Exceptional expedition leaders! The safety standards on summit day were world-class.',
  })
  @Prop({ type: String, required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({
    example: 'Expedition Leader, Keokradong Batch 12',
    description: 'Author designation / role shown under the name',
  })
  @Prop({ type: String, default: '', trim: true })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  designation?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=xyz' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ description: 'Optional related Program ID' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Program.name,
    required: false,
    index: true,
  })
  @IsOptional()
  @IsMongoId()
  programId?: string;

  @ApiPropertyOptional({ example: 'Kedarkantha Winter Summit Trek' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  programTitle?: string;

  @ApiPropertyOptional({ example: true, default: false })
  @Prop({ type: Boolean, default: false, index: true })
  @IsOptional()
  @IsBoolean()
  isFeatured: boolean;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @Prop({ type: Number, default: 0 })
  @IsOptional()
  @IsNumber()
  order: number;

  @ApiProperty({ enum: ReviewStatus, default: ReviewStatus.APPROVED })
  @Prop({
    type: String,
    enum: ReviewStatus,
    default: ReviewStatus.APPROVED,
    index: true,
  })
  @IsEnum(ReviewStatus)
  status: ReviewStatus;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

ReviewSchema.index({ organizationId: 1, status: 1, isFeatured: 1 });

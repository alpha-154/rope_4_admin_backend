import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose, { Document } from 'mongoose';
import { Organization } from '../../organization/entities/organization.entity';

export type HighlightDocument = Highlight & Document;

export class HighlightItem {
  @ApiPropertyOptional({ example: 'award', description: 'Lucide icon name or image URL' })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({ example: '16+ Years', description: 'Stat or numerical value' })
  @IsOptional()
  @IsString()
  value?: string;

  @ApiProperty({ example: 'Experience in Adventure', description: 'Main card label/title' })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiPropertyOptional({ example: 'Leading high-altitude treks worldwide', description: 'Secondary descriptive text' })
  @IsOptional()
  @IsString()
  sublabel?: string;

  @ApiPropertyOptional({ example: '<p>Detailed description</p>', description: 'Rich text content' })
  @IsOptional()
  @IsString()
  richText?: string;
}

@Schema({
  timestamps: true,
  collection: 'highlights',
  toJSON: {
    virtuals: true,
  },
})
export class Highlight {
  @ApiProperty({ description: 'Organization reference' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  @IsMongoId()
  organizationId: string;

  @ApiProperty({ example: 'why-choose-us', description: 'Section identifier' })
  @Prop({ type: String, required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  sectionKey: string;

  @ApiProperty({ example: 'why-choose-us', description: 'Unique slug for URL lookup' })
  @Prop({ type: String, required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Why Choose Us', description: 'Tagline or badge' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ example: 'India and Global Mountain Experts', description: 'Section main title' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  sectionTitle?: string;

  @ApiPropertyOptional({ example: 'Pioneers in high-altitude treks and wilderness survival.', description: 'Section description' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  sectionDescription?: string;

  @ApiProperty({ type: [HighlightItem], description: 'List of highlight items/cards' })
  @Prop({ type: [Object], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HighlightItem)
  items: HighlightItem[];

  @ApiPropertyOptional({ example: true, default: true })
  @Prop({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({ example: true, default: true })
  @Prop({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isPublic: boolean;
}

export const HighlightSchema = SchemaFactory.createForClass(Highlight);

HighlightSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
HighlightSchema.index({ organizationId: 1, sectionKey: 1 });


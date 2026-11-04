import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose, { Document } from 'mongoose';
import { Organization } from '../../organization/entities/organization.entity';

export type PopoverDocument = Popover & Document;

export enum PopoverType {
  MODAL = 'modal',
  SIDE_TAB = 'side-tab',
  HELP_BUBBLE = 'help-bubble',
  BANNER = 'banner',
}

export enum PopoverFrequency {
  ALWAYS = 'always',
  ONCE_PER_SESSION = 'once_per_session',
  ONCE = 'once',
}

export enum PopoverPageTarget {
  ALL = 'all',
  HOME = 'home',
  PROGRAMS = 'programs',
  SHOP = 'shop',
}

@Schema({ _id: false })
export class PopoverCta {
  @ApiProperty({ example: 'Book Now', description: 'CTA button label' })
  @Prop({ type: String, default: '' })
  @IsString()
  label: string;

  @ApiProperty({ example: '/programs', description: 'CTA destination URL' })
  @Prop({ type: String, default: '' })
  @IsString()
  url: string;
}

export const PopoverCtaSchema = SchemaFactory.createForClass(PopoverCta);

@Schema({
  timestamps: true,
  collection: 'popovers',
  toJSON: { virtuals: true },
})
export class Popover {
  @ApiProperty({ description: 'Organization reference' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  @IsMongoId()
  organizationId: string;

  @ApiProperty({ enum: PopoverType, default: PopoverType.MODAL })
  @Prop({
    type: String,
    enum: PopoverType,
    default: PopoverType.MODAL,
    index: true,
  })
  @IsEnum(PopoverType)
  type: PopoverType;

  @ApiProperty({ example: 'Winter Trek Early Bird Offer' })
  @Prop({ type: String, required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Book your Himalayan winter departure before November 30 and get 15% off.' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ type: PopoverCta })
  @Prop({ type: PopoverCtaSchema, default: () => ({}) })
  @IsOptional()
  @ValidateNested()
  @Type(() => PopoverCta)
  cta?: PopoverCta;

  @ApiPropertyOptional({ example: '/uploads/popovers/early-bird.jpg' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 'all', description: 'all | home | programs | shop or custom path' })
  @Prop({ type: String, default: 'all', index: true })
  @IsString()
  pageTargeting: string;

  @ApiProperty({ example: 3, description: 'Trigger delay in seconds before showing' })
  @Prop({ type: Number, default: 3 })
  @IsNumber()
  triggerDelay: number;

  @ApiProperty({ enum: PopoverFrequency, default: PopoverFrequency.ALWAYS })
  @Prop({
    type: String,
    enum: PopoverFrequency,
    default: PopoverFrequency.ALWAYS,
  })
  @IsEnum(PopoverFrequency)
  displayFrequency: PopoverFrequency;

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  @IsOptional()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @Prop({ type: Date, default: null })
  @IsOptional()
  endDate?: Date;

  @ApiProperty({ example: true, default: true })
  @Prop({ type: Boolean, default: true, index: true })
  @IsBoolean()
  isActive: boolean;
}

export const PopoverSchema = SchemaFactory.createForClass(Popover);

PopoverSchema.index({ organizationId: 1, isActive: 1, type: 1 });

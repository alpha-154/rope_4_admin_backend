import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import mongoose, { Document } from 'mongoose';
import { Organization } from '../../organization/entities/organization.entity';

export type HighlightDocument = Highlight & Document;

/** Sign/suffix rendered right after the numeric value, e.g. 16 + "+" = "16+". */
export const HIGHLIGHT_VALUE_SIGNS = [
  '',
  '+',
  '-',
  '*',
  '%',
  'x',
  'K',
  'K+',
  'M',
  'M+',
] as const;
export type HighlightValueSign = (typeof HIGHLIGHT_VALUE_SIGNS)[number];

@Schema({ _id: false })
export class HighlightItem {
  @ApiProperty({ example: 'Alpine Experience', description: 'Card title' })
  @Prop({ type: String, required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  @MaxLength(120)
  label: string;

  @ApiPropertyOptional({
    example: 'Led by NIM certified chief instructors & Himalayan summitteers.',
    description: 'Card description (multi-line)',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(600)
  description?: string;

  @ApiPropertyOptional({ example: 16, description: 'Numeric stat value' })
  @Prop({ type: Number, default: null })
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false })
  value?: number | null;

  @ApiPropertyOptional({
    enum: HIGHLIGHT_VALUE_SIGNS,
    example: '+',
    description: 'Sign/suffix shown after the value',
  })
  @Prop({ type: String, enum: HIGHLIGHT_VALUE_SIGNS, default: '' })
  @IsOptional()
  @IsIn(HIGHLIGHT_VALUE_SIGNS as unknown as string[])
  valueSign?: HighlightValueSign;

  @ApiPropertyOptional({
    example: 'trophy',
    description: 'Icon name (see admin icon picker)',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string;
}
export const HighlightItemSchema = SchemaFactory.createForClass(HighlightItem);

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

  @ApiPropertyOptional({
    example: 'Wilderness Safety & Instruction',
    description: 'Badge / tagline above the title',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({
    example: 'Why Learn & Trek With Rope4?',
    description: 'Section main title',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  sectionTitle?: string;

  @ApiPropertyOptional({
    example: 'We operate under the strictest mountaineering safety guidelines.',
    description: 'Section description',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  sectionDescription?: string;

  @ApiProperty({
    type: [HighlightItem],
    description: 'Highlight cards / stats',
  })
  @Prop({ type: [HighlightItemSchema], default: [] })
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

HighlightSchema.index({ organizationId: 1, isActive: 1, isPublic: 1 });

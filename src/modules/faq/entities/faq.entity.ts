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

export type FaqDocument = Faq & Document;

@Schema({ _id: false })
export class FaqItem {
  @ApiProperty({ example: 'What fitness level is required?' })
  @Prop({ type: String, required: true, trim: true })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    example: 'Participants should be able to jog 5km in under 35 minutes.',
  })
  @Prop({ type: String, required: true, trim: true })
  @IsString()
  @IsNotEmpty()
  answer: string;
}

export const FaqItemSchema = SchemaFactory.createForClass(FaqItem);

@Schema({
  timestamps: true,
  collection: 'faqs',
  toJSON: { virtuals: true },
})
export class Faq {
  @ApiProperty({ description: 'Organization reference ID' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  @IsMongoId()
  organizationId: string;

  @ApiProperty({ example: 'Beginners Guide', description: 'FAQ Category name' })
  @Prop({ type: String, required: true, trim: true })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    example: 'beginners-guide',
    description: 'URL-friendly slug for the FAQ group',
  })
  @Prop({ type: String, required: true, trim: true })
  @IsString()
  slug: string;

  @ApiPropertyOptional({
    example: 'a0',
    description: 'Fractional index for category order',
  })
  @Prop({ type: String, default: null })
  @IsOptional()
  @IsString()
  index?: string;

  @ApiPropertyOptional({ type: [FaqItem], description: 'List of Q&A items' })
  @Prop({ type: [FaqItemSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItem)
  faqs: FaqItem[];

  @ApiPropertyOptional({ default: true })
  @Prop({ type: Boolean, default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export const FaqSchema = SchemaFactory.createForClass(Faq);

FaqSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
FaqSchema.index({ organizationId: 1, index: 1 });

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import mongoose, { HydratedDocument } from 'mongoose';
import { Organization } from '../../organization/entities/organization.entity';

/** Managed list of FAQ category names (picked in the FAQ group dialog). */
@Schema({ timestamps: true, collection: 'faq_categories' })
export class FaqCategory {
  @ApiProperty({ type: String })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  organizationId: mongoose.Types.ObjectId;

  @ApiProperty({ example: 'Safety & Medical' })
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @ApiProperty({ example: 'safety-medical' })
  @Prop({ type: String, required: true, trim: true, lowercase: true })
  slug: string;
}

export type FaqCategoryDocument = HydratedDocument<FaqCategory>;
export const FaqCategorySchema = SchemaFactory.createForClass(FaqCategory);
FaqCategorySchema.index({ organizationId: 1, slug: 1 }, { unique: true });
FaqCategorySchema.index(
  { organizationId: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

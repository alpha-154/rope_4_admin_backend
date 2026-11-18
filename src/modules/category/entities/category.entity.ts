import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import mongoose, { HydratedDocument } from 'mongoose';
import { Organization } from '../../organization/entities/organization.entity';

@Schema({
  timestamps: true,
  collection: 'categories',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Category {
  @ApiProperty({ type: String, description: 'Organization reference ID' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  organizationId: mongoose.Types.ObjectId;

  @ApiProperty({ example: 'Summer Camp' })
  @Prop({ type: String, required: true, trim: true })
  name: string;

  @ApiProperty({ example: 'summer-camp' })
  @Prop({ type: String, required: true, trim: true, lowercase: true })
  slug: string;

  @ApiPropertyOptional({ example: 'Youth wilderness survival camps' })
  @Prop({ type: String, default: '' })
  description?: string;

  @ApiPropertyOptional({
    description:
      'Optional cover image URL. When empty, the first program hero image is used.',
  })
  @Prop({ type: String, default: '' })
  image?: string;

  @ApiProperty({ default: true })
  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;
}

export type CategoryDocument = HydratedDocument<Category>;
export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.index({ organizationId: 1, slug: 1 }, { unique: true });
// Case-insensitive uniqueness of the display name inside an organization
CategorySchema.index(
  { organizationId: 1, name: 1 },
  { unique: true, collation: { locale: 'en', strength: 2 } },
);

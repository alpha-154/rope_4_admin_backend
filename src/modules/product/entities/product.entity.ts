import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import mongoose, { Document, HydratedDocument } from 'mongoose';
import { Organization } from '@/modules/organization/entities/organization.entity';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ _id: false })
export class ProductVariant {
  @ApiProperty({ example: 'R4-TSH-BLK-M' })
  @Prop({ type: String, required: true })
  sku: string;

  @ApiPropertyOptional({ example: 'M' })
  @Prop({ type: String, default: '' })
  size?: string;

  @ApiPropertyOptional({ example: 'Forest Green' })
  @Prop({ type: String, default: '' })
  color?: string;

  @ApiPropertyOptional({ example: 1200 })
  @Prop({ type: Number })
  price?: number;

  @ApiPropertyOptional({ example: 20 })
  @Prop({ type: Number, default: 0 })
  stockQuantity?: number;
}

export const ProductVariantSchema =
  SchemaFactory.createForClass(ProductVariant);

@Schema({ _id: false })
export class ProductSpecification {
  @ApiProperty({ example: 'Weight' })
  @Prop({ type: String, required: true })
  key: string;

  @ApiProperty({ example: '350g' })
  @Prop({ type: String, required: true })
  value: string;
}

export const ProductSpecificationSchema =
  SchemaFactory.createForClass(ProductSpecification);

@Schema({
  timestamps: true,
  collection: 'products',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Product extends Document {
  @ApiProperty({ example: 'Rope4 Alpine Expedition Backpack 45L' })
  @Prop({ type: String, required: true, trim: true, index: true })
  title: string;

  @ApiProperty({ example: 'rope4-alpine-expedition-backpack-45l' })
  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  slug: string;

  @ApiProperty({ example: 'R4-BPK-45L' })
  @Prop({
    type: String,
    required: true,
    trim: true,
    uppercase: true,
    index: true,
  })
  sku: string;

  @ApiProperty({ example: 'Camping & Backpacking' })
  @Prop({
    type: String,
    required: true,
    index: true,
    enum: [
      'Apparel',
      'Footwear',
      'Climbing Gear',
      'Camping & Backpacking',
      'Accessories',
      'Navigation & Safety',
      'Other',
    ],
    default: 'Other',
  })
  category: string;

  @ApiProperty({ example: 'Rope4' })
  @Prop({ type: String, default: 'Rope4', trim: true })
  brand: string;

  @ApiPropertyOptional({
    example: 'Rugged weather-resistant 45L technical pack.',
  })
  @Prop({ type: String, default: '' })
  shortDescription: string;

  @ApiPropertyOptional({
    description: 'Full description in markdown or rich text',
  })
  @Prop({ type: String, default: '' })
  description: string;

  @ApiProperty({ example: 4500 })
  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @ApiPropertyOptional({ example: 5200 })
  @Prop({ type: Number, default: null })
  compareAtPrice?: number;

  @ApiPropertyOptional({ example: 3200 })
  @Prop({ type: Number, default: null })
  costPrice?: number;

  @ApiProperty({ example: 25, description: 'Available stock quantity' })
  @Prop({ type: Number, required: true, default: 0, min: 0, index: true })
  stockQuantity: number;

  @ApiProperty({ example: 5, default: 5 })
  @Prop({ type: Number, default: 5 })
  lowStockThreshold: number;

  @ApiProperty({
    type: [String],
    example: ['https://example.com/backpack1.jpg'],
  })
  @Prop({ type: [String], default: [] })
  images: string[];

  @ApiProperty({ type: [ProductVariant] })
  @Prop({ type: [ProductVariantSchema], default: [] })
  variants: ProductVariant[];

  @ApiProperty({ type: [ProductSpecification] })
  @Prop({ type: [ProductSpecificationSchema], default: [] })
  specifications: ProductSpecification[];

  @ApiProperty({
    type: [String],
    example: ['backpack', 'alpine', 'waterproof'],
  })
  @Prop({ type: [String], default: [] })
  tags: string[];

  @ApiProperty({ default: true })
  @Prop({ type: Boolean, default: true, index: true })
  isPublished: boolean;

  @ApiProperty({ default: false })
  @Prop({ type: Boolean, default: false, index: true })
  isFeatured: boolean;

  @ApiProperty({ default: 5.0 })
  @Prop({ type: Number, default: 5.0 })
  rating: number;

  @ApiProperty({ default: 0 })
  @Prop({ type: Number, default: 0 })
  reviewsCount: number;

  @ApiProperty({ description: 'Organization tenant reference' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  organizationId: mongoose.Types.ObjectId;

  @ApiProperty({ default: false })
  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

ProductSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
ProductSchema.index({ organizationId: 1, sku: 1 }, { unique: true });
ProductSchema.index({
  organizationId: 1,
  isPublished: 1,
  isDeleted: 1,
  category: 1,
});

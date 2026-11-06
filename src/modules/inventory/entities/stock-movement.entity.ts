import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import mongoose, { Document, HydratedDocument } from 'mongoose';
import { Organization } from '@/modules/organization/entities/organization.entity';
import { Product } from '@/modules/product/entities/product.entity';

export type StockMovementDocument = HydratedDocument<StockMovement>;

export enum StockMovementType {
  PURCHASE_RECEIPT = 'PURCHASE_RECEIPT',
  ORDER_REDUCTION = 'ORDER_REDUCTION',
  RETURN_RESTOCK = 'RETURN_RESTOCK',
  MANUAL_ADJUSTMENT = 'MANUAL_ADJUSTMENT',
  DAMAGE_DISCARD = 'DAMAGE_DISCARD',
}

@Schema({
  timestamps: true,
  collection: 'stock_movements',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class StockMovement extends Document {
  @ApiProperty({ description: 'Referenced Product ID' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Product.name,
    required: true,
    index: true,
  })
  productId: mongoose.Types.ObjectId;

  @ApiProperty({ example: 'Rope4 Expedition Technical Backpack 55L' })
  @Prop({ type: String, required: true })
  productTitle: string;

  @ApiProperty({ example: 'R4-BPK-55L' })
  @Prop({ type: String, required: true })
  sku: string;

  @ApiProperty({ description: 'Organization tenant reference' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  organizationId: mongoose.Types.ObjectId;

  @ApiProperty({
    enum: StockMovementType,
    example: StockMovementType.MANUAL_ADJUSTMENT,
  })
  @Prop({
    type: String,
    enum: Object.values(StockMovementType),
    required: true,
    index: true,
  })
  type: StockMovementType;

  @ApiProperty({ example: 10, description: 'Positive or negative delta' })
  @Prop({ type: Number, required: true })
  quantityChange: number;

  @ApiProperty({ example: 20 })
  @Prop({ type: Number, required: true })
  quantityBefore: number;

  @ApiProperty({ example: 30 })
  @Prop({ type: Number, required: true })
  quantityAfter: number;

  @ApiPropertyOptional({ example: 'R4-ORD-2026-1024' })
  @Prop({ type: String, default: null, index: true })
  referenceId?: string;

  @ApiPropertyOptional({
    example: 'Received new inventory shipment from supplier',
  })
  @Prop({ type: String, default: '' })
  reason: string;

  @ApiProperty({ example: 'admin@rope4.org' })
  @Prop({ type: String, default: 'System' })
  performedBy: string;
}

export const StockMovementSchema = SchemaFactory.createForClass(StockMovement);

StockMovementSchema.index({ organizationId: 1, createdAt: -1 });
StockMovementSchema.index({ organizationId: 1, productId: 1, createdAt: -1 });

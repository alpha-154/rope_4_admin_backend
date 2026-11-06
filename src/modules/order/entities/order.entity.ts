import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import mongoose, { Document, HydratedDocument } from 'mongoose';
import { Customer } from '@/modules/customer/entities/customer.entity';
import { Organization } from '@/modules/organization/entities/organization.entity';
import { Product } from '@/modules/product/entities/product.entity';

export type OrderDocument = HydratedDocument<Order>;

export enum OrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  COD = 'COD',
  BKASH = 'BKASH',
  NAGAD = 'NAGAD',
  CARD = 'CARD',
  STRIPE = 'STRIPE',
}

@Schema({ _id: false })
export class OrderShippingAddress {
  @ApiProperty({ example: 'House 12, Road 4, Dhanmondi' })
  @Prop({ type: String, required: true })
  street: string;

  @ApiProperty({ example: 'Dhaka' })
  @Prop({ type: String, required: true })
  city: string;

  @ApiPropertyOptional({ example: 'Dhaka Division' })
  @Prop({ type: String, default: '' })
  state: string;

  @ApiProperty({ example: '1205' })
  @Prop({ type: String, required: true })
  postalCode: string;

  @ApiProperty({ example: 'Bangladesh' })
  @Prop({ type: String, default: 'Bangladesh' })
  country: string;
}

export const OrderShippingAddressSchema =
  SchemaFactory.createForClass(OrderShippingAddress);

@Schema({ _id: false })
export class OrderItem {
  @ApiProperty()
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Product.name,
    required: true,
  })
  productId: mongoose.Types.ObjectId;

  @ApiProperty({ example: 'Rope4 Expedition Technical Backpack 55L' })
  @Prop({ type: String, required: true })
  productTitle: string;

  @ApiProperty({ example: 'R4-BPK-55L' })
  @Prop({ type: String, required: true })
  sku: string;

  @ApiPropertyOptional({ example: { size: '55L', color: 'Black' } })
  @Prop({ type: Object, default: null })
  variant?: { size?: string; color?: string };

  @ApiProperty({ example: 2 })
  @Prop({ type: Number, required: true, min: 1 })
  quantity: number;

  @ApiProperty({ example: 6800 })
  @Prop({ type: Number, required: true, min: 0 })
  unitPrice: number;

  @ApiProperty({ example: 13600 })
  @Prop({ type: Number, required: true, min: 0 })
  subtotal: number;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null })
  image?: string;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

@Schema({ _id: false })
export class OrderStatusRecord {
  @ApiProperty({ enum: OrderStatus })
  @Prop({ type: String, enum: Object.values(OrderStatus), required: true })
  status: OrderStatus;

  @ApiProperty()
  @Prop({ type: Date, default: () => new Date() })
  timestamp: Date;

  @ApiPropertyOptional()
  @Prop({ type: String, default: '' })
  note: string;

  @ApiPropertyOptional()
  @Prop({ type: String, default: 'System' })
  changedBy: string;
}

export const OrderStatusRecordSchema =
  SchemaFactory.createForClass(OrderStatusRecord);

@Schema({
  timestamps: true,
  collection: 'orders',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Order extends Document {
  @ApiProperty({ example: 'R4-ORD-2026-0891' })
  @Prop({ type: String, required: true, index: true })
  orderNumber: string;

  @ApiProperty({ description: 'Organization tenant reference' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  organizationId: mongoose.Types.ObjectId;

  @ApiPropertyOptional({ description: 'Registered customer ID if logged in' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Customer.name,
    default: null,
    index: true,
  })
  customerId?: mongoose.Types.ObjectId;

  @ApiProperty({ example: 'traveler@gmail.com' })
  @Prop({
    type: String,
    required: true,
    index: true,
    lowercase: true,
    trim: true,
  })
  customerEmail: string;

  @ApiProperty({ example: 'Tanvir Ahmed' })
  @Prop({ type: String, required: true, trim: true })
  customerName: string;

  @ApiProperty({ example: '+8801711223344' })
  @Prop({ type: String, required: true, trim: true })
  customerPhone: string;

  @ApiProperty({ type: OrderShippingAddress })
  @Prop({ type: OrderShippingAddressSchema, required: true })
  shippingAddress: OrderShippingAddress;

  @ApiProperty({ type: [OrderItem] })
  @Prop({ type: [OrderItemSchema], required: true })
  items: OrderItem[];

  @ApiProperty({ example: 13600 })
  @Prop({ type: Number, required: true, min: 0 })
  subtotal: number;

  @ApiProperty({ example: 120, default: 0 })
  @Prop({ type: Number, default: 0, min: 0 })
  shippingFee: number;

  @ApiProperty({ example: 0, default: 0 })
  @Prop({ type: Number, default: 0, min: 0 })
  discountAmount: number;

  @ApiProperty({ example: 13720 })
  @Prop({ type: Number, required: true, min: 0 })
  totalAmount: number;

  @ApiProperty({ enum: PaymentStatus, default: PaymentStatus.PENDING })
  @Prop({
    type: String,
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
    index: true,
  })
  paymentStatus: PaymentStatus;

  @ApiProperty({ enum: PaymentMethod, default: PaymentMethod.COD })
  @Prop({
    type: String,
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.COD,
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({ enum: OrderStatus, default: OrderStatus.PENDING })
  @Prop({
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    index: true,
  })
  status: OrderStatus;

  @ApiProperty({ type: [OrderStatusRecord] })
  @Prop({ type: [OrderStatusRecordSchema], default: [] })
  statusHistory: OrderStatusRecord[];

  @ApiPropertyOptional({ example: 'Please call before delivery' })
  @Prop({ type: String, default: '' })
  customerNotes: string;

  @ApiPropertyOptional({ example: 'Verified address via phone call' })
  @Prop({ type: String, default: '' })
  adminNotes: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.index({ organizationId: 1, orderNumber: 1 }, { unique: true });
OrderSchema.index({ organizationId: 1, createdAt: -1 });
OrderSchema.index({ organizationId: 1, status: 1, createdAt: -1 });

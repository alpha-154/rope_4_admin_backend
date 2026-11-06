import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import mongoose, { Document, HydratedDocument } from 'mongoose';
import { Organization } from '@/modules/organization/entities/organization.entity';

export type CustomerDocument = HydratedDocument<Customer>;

@Schema({ _id: false })
export class ShippingAddress {
  @ApiProperty()
  @Prop({ type: String, required: true })
  id: string;

  @ApiProperty({ example: 'Home' })
  @Prop({ type: String, default: 'Home' })
  label: string;

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

  @ApiProperty({ default: false })
  @Prop({ type: Boolean, default: false })
  isDefault: boolean;
}

export const ShippingAddressSchema =
  SchemaFactory.createForClass(ShippingAddress);

@Schema({
  timestamps: true,
  collection: 'customers',
  toJSON: {
    virtuals: true,
    transform: (_doc, ret: any) => {
      delete ret.passwordHash;
      delete ret.refreshTokenHash;
      return ret;
    },
  },
  toObject: { virtuals: true },
})
export class Customer extends Document {
  @ApiProperty({ example: 'traveler@gmail.com' })
  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  email: string;

  @Prop({ type: String, required: true, select: false })
  passwordHash: string;

  @ApiProperty({ example: 'Tanvir' })
  @Prop({ type: String, required: true, trim: true })
  firstName: string;

  @ApiProperty({ example: 'Ahmed' })
  @Prop({ type: String, required: true, trim: true })
  lastName: string;

  @ApiPropertyOptional({ example: '+8801711223344' })
  @Prop({ type: String, default: '', trim: true })
  phone: string;

  @ApiPropertyOptional()
  @Prop({ type: String, default: null })
  avatar?: string;

  @ApiProperty({ description: 'Organization tenant reference' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  organizationId: mongoose.Types.ObjectId;

  @ApiProperty({ type: [ShippingAddress] })
  @Prop({ type: [ShippingAddressSchema], default: [] })
  shippingAddresses: ShippingAddress[];

  @ApiProperty({ description: 'Wishlist item IDs (Programs or Products)' })
  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId }],
    default: [],
    index: true,
  })
  wishlist: mongoose.Types.ObjectId[];

  @ApiProperty({ default: 0 })
  @Prop({ type: Number, default: 0 })
  totalOrders: number;

  @ApiProperty({ default: 0 })
  @Prop({ type: Number, default: 0 })
  totalSpent: number;

  @ApiProperty({ default: true })
  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @ApiProperty({ default: false })
  @Prop({ type: Boolean, default: false, index: true })
  isBlocked: boolean;

  @Prop({ type: String, default: null, select: false })
  refreshTokenHash?: string;

  async comparePassword(plainText: string): Promise<boolean> {
    if (!this.passwordHash) return false;
    return bcrypt.compare(plainText, this.passwordHash);
  }
}

export const CustomerSchema = SchemaFactory.createForClass(Customer);

CustomerSchema.index({ organizationId: 1, email: 1 }, { unique: true });

CustomerSchema.virtual('fullName').get(function (this: Customer) {
  return `${this.firstName} ${this.lastName}`.trim();
});

CustomerSchema.methods.comparePassword = async function (
  plainText: string,
): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(plainText, this.passwordHash);
};

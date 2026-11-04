import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { Document, HydratedDocument } from 'mongoose';

export type OrganizationDocument = HydratedDocument<Organization>;

@Schema({ _id: false })
export class SocialLinks {
  @ApiPropertyOptional({ example: 'https://facebook.com/rope4' })
  @Prop({ type: String, default: null })
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/rope4' })
  @Prop({ type: String, default: null })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/@rope4' })
  @Prop({ type: String, default: null })
  @IsOptional()
  @IsString()
  youtube?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/rope4' })
  @Prop({ type: String, default: null })
  @IsOptional()
  @IsString()
  linkedin?: string;
}

export const SocialLinksSchema = SchemaFactory.createForClass(SocialLinks);

@Schema({ _id: false })
export class OrgSettings {
  @ApiPropertyOptional({ example: 'BDT', default: 'BDT' })
  @Prop({ type: String, default: 'BDT' })
  @IsOptional()
  @IsString()
  currency: string;

  @ApiPropertyOptional({ example: 'Asia/Dhaka', default: 'Asia/Dhaka' })
  @Prop({ type: String, default: 'Asia/Dhaka' })
  @IsOptional()
  @IsString()
  timezone: string;

  @ApiPropertyOptional({ example: 0, default: 0 })
  @Prop({ type: Number, default: 0 })
  @IsOptional()
  defaultTaxPercent: number;
}

export const OrgSettingsSchema = SchemaFactory.createForClass(OrgSettings);

@Schema({
  timestamps: true,
  collection: 'organizations',
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
})
export class Organization extends Document {
  @ApiProperty({
    description: 'Organization name',
    example: 'Rope4 Outdoor Education',
  })
  @Prop({ type: String, required: true, trim: true, unique: true })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'URL-friendly identifier', example: 'rope4' })
  @Prop({ type: String, required: true, trim: true, unique: true, index: true })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({
    description: 'Logo URL',
    example: 'https://rope4.org/logo.png',
  })
  @Prop({ type: String, default: null })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiProperty({
    description: 'Primary contact email',
    example: 'contact@rope4.org',
  })
  @Prop({ type: String, required: true, trim: true, lowercase: true })
  @IsEmail()
  contactEmail: string;

  @ApiPropertyOptional({
    description: 'Primary contact phone',
    example: '+880 1700-000000',
  })
  @Prop({ type: String, default: null })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({
    description: 'Physical address',
    example: 'Dhaka, Bangladesh',
  })
  @Prop({ type: String, default: null })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ description: 'Social media links', type: SocialLinks })
  @Prop({ type: SocialLinksSchema, default: () => ({}) })
  @IsOptional()
  socialLinks?: SocialLinks;

  @ApiPropertyOptional({
    description: 'Organization configuration',
    type: OrgSettings,
  })
  @Prop({
    type: OrgSettingsSchema,
    default: () => ({
      currency: 'BDT',
      timezone: 'Asia/Dhaka',
      defaultTaxPercent: 0,
    }),
  })
  @IsOptional()
  settings?: OrgSettings;

  @ApiProperty({ description: 'Active status', default: true })
  @Prop({ type: Boolean, default: true, index: true })
  isActive: boolean;

  @ApiProperty({ description: 'Soft deletion flag', default: false })
  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;
}

export const OrganizationSchema = SchemaFactory.createForClass(Organization);

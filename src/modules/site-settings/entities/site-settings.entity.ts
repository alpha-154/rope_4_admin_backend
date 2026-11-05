import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose, { HydratedDocument } from 'mongoose';
import { Organization } from '../../organization/entities/organization.entity';

export type SiteSettingsDocument = HydratedDocument<SiteSettings>;

// --- Header Sub-Schemas ---

@Schema({ _id: false })
export class HeaderNavSubItem {
  @ApiProperty({ example: 'Keokradong Summit Trek' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: '/programs/keokradong-summit' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  href: string;

  @ApiPropertyOptional({ example: 'Highest peak adventure in Bandarban' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Popular' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ example: '/images/keokradong.jpg' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  image?: string;
}

export const HeaderNavSubItemSchema =
  SchemaFactory.createForClass(HeaderNavSubItem);

@Schema({ _id: false })
export class HeaderNavCategory {
  @ApiProperty({ example: 'Himalayan Expeditions' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ type: [HeaderNavSubItem] })
  @Prop({ type: [HeaderNavSubItemSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HeaderNavSubItem)
  items: HeaderNavSubItem[];
}

export const HeaderNavCategorySchema =
  SchemaFactory.createForClass(HeaderNavCategory);

@Schema({ _id: false })
export class HeaderNavItem {
  @ApiProperty({ example: 'Choose Trek' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: '/programs' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  href: string;

  @ApiProperty({ example: false })
  @Prop({ type: Boolean, default: false })
  @IsBoolean()
  isMegaMenu: boolean;

  @ApiPropertyOptional({ type: [HeaderNavSubItem] })
  @Prop({ type: [HeaderNavSubItemSchema], default: [] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HeaderNavSubItem)
  children?: HeaderNavSubItem[];

  @ApiPropertyOptional({ type: [HeaderNavCategory] })
  @Prop({ type: [HeaderNavCategorySchema], default: [] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HeaderNavCategory)
  megaMenuCategories?: HeaderNavCategory[];
}

export const HeaderNavItemSchema = SchemaFactory.createForClass(HeaderNavItem);

@Schema({ _id: false })
export class HeaderAnnouncement {
  @ApiProperty({ example: true })
  @Prop({ type: Boolean, default: false })
  @IsBoolean()
  enabled: boolean;

  @ApiProperty({ example: 'Early Bird 15% off for Monsoon Trek Batches!' })
  @Prop({ type: String, default: '' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ example: '/programs?season=monsoon' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  linkUrl?: string;

  @ApiPropertyOptional({ example: 'Special Offer' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  badge?: string;
}

export const HeaderAnnouncementSchema =
  SchemaFactory.createForClass(HeaderAnnouncement);

@Schema({ _id: false })
export class HeaderQuickContact {
  @ApiPropertyOptional({ example: '+880 1711 000 000' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'adventure@rope4.org' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional({ example: 'Dhaka, Bangladesh' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  address?: string;
}

export const HeaderQuickContactSchema =
  SchemaFactory.createForClass(HeaderQuickContact);

@Schema({ _id: false })
export class HeaderCtaButton {
  @ApiProperty({ example: 'Book A Trek' })
  @Prop({ type: String, default: 'Book A Trek' })
  @IsString()
  label: string;

  @ApiProperty({ example: '/programs' })
  @Prop({ type: String, default: '/programs' })
  @IsString()
  url: string;

  @ApiProperty({ example: true })
  @Prop({ type: Boolean, default: true })
  @IsBoolean()
  isVisible: boolean;
}

export const HeaderCtaButtonSchema =
  SchemaFactory.createForClass(HeaderCtaButton);

@Schema({ _id: false })
export class HeaderSettings {
  @ApiPropertyOptional({ example: '/images/rope4-logo.svg' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'Rope4' })
  @Prop({ type: String, default: 'Rope4' })
  @IsOptional()
  @IsString()
  logoText?: string;

  @ApiPropertyOptional({ example: 'Outdoor Education & Adventure' })
  @Prop({ type: String, default: 'Outdoor Education & Adventure' })
  @IsOptional()
  @IsString()
  tagline?: string;

  @ApiProperty({ type: HeaderAnnouncement })
  @Prop({
    type: HeaderAnnouncementSchema,
    default: () => ({ enabled: false, text: '' }),
  })
  @ValidateNested()
  @Type(() => HeaderAnnouncement)
  announcement: HeaderAnnouncement;

  @ApiProperty({ type: HeaderQuickContact })
  @Prop({ type: HeaderQuickContactSchema, default: () => ({}) })
  @ValidateNested()
  @Type(() => HeaderQuickContact)
  quickContact: HeaderQuickContact;

  @ApiProperty({ type: HeaderCtaButton })
  @Prop({
    type: HeaderCtaButtonSchema,
    default: () => ({
      label: 'Plan Adventure',
      url: '/programs',
      isVisible: true,
    }),
  })
  @ValidateNested()
  @Type(() => HeaderCtaButton)
  ctaButton: HeaderCtaButton;

  @ApiProperty({ type: [HeaderNavItem] })
  @Prop({ type: [HeaderNavItemSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HeaderNavItem)
  navItems: HeaderNavItem[];
}

export const HeaderSettingsSchema =
  SchemaFactory.createForClass(HeaderSettings);

// --- Footer Sub-Schemas ---

@Schema({ _id: false })
export class FooterLinkItem {
  @ApiProperty({ example: 'About Rope4' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: '/about' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: false })
  @Prop({ type: Boolean, default: false })
  @IsOptional()
  @IsBoolean()
  openInNewTab?: boolean;
}

export const FooterLinkItemSchema =
  SchemaFactory.createForClass(FooterLinkItem);

@Schema({ _id: false })
export class FooterColumn {
  @ApiProperty({ example: 'Top Adventures' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ type: [FooterLinkItem] })
  @Prop({ type: [FooterLinkItemSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkItem)
  links: FooterLinkItem[];
}

export const FooterColumnSchema = SchemaFactory.createForClass(FooterColumn);

@Schema({ _id: false })
export class FooterSocialLink {
  @ApiProperty({ example: 'facebook' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  platform: string;

  @ApiProperty({ example: 'https://facebook.com/rope4' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  url: string;

  @ApiPropertyOptional({ example: 'facebook' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  icon?: string;
}

export const FooterSocialLinkSchema =
  SchemaFactory.createForClass(FooterSocialLink);

@Schema({ _id: false })
export class FooterBadge {
  @ApiProperty({ example: 'Certified Mountaineering Institute' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  label: string;

  @ApiProperty({ example: '/badges/certified.svg' })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  imageUrl: string;

  @ApiPropertyOptional({ example: 'https://rope4.org/certifications' })
  @Prop({ type: String })
  @IsOptional()
  @IsString()
  linkUrl?: string;
}

export const FooterBadgeSchema = SchemaFactory.createForClass(FooterBadge);

@Schema({ _id: false })
export class FooterSettings {
  @ApiProperty({
    example:
      'Rope4 provides world-class outdoor education and adventure travel experiences.',
  })
  @Prop({
    type: String,
    default:
      'Rope4 is an outdoor education, mountaineering, and experiential adventure organization dedicated to responsible wilderness exploration worldwide.',
  })
  @IsString()
  aboutText: string;

  @ApiProperty({ example: '© 2026 Rope4. All rights reserved.' })
  @Prop({ type: String, default: '© 2026 Rope4. All rights reserved.' })
  @IsString()
  copyright: string;

  @ApiPropertyOptional({ example: '+880 1800 000 000' })
  @Prop({ type: String, default: '+880 1800 000 000' })
  @IsOptional()
  @IsString()
  emergencyHotline?: string;

  @ApiProperty({ type: [FooterColumn] })
  @Prop({ type: [FooterColumnSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterColumn)
  columns: FooterColumn[];

  @ApiProperty({ type: [FooterSocialLink] })
  @Prop({ type: [FooterSocialLinkSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterSocialLink)
  socialLinks: FooterSocialLink[];

  @ApiProperty({ type: [FooterLinkItem] })
  @Prop({ type: [FooterLinkItemSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterLinkItem)
  bottomLinks: FooterLinkItem[];

  @ApiProperty({ type: [FooterBadge] })
  @Prop({ type: [FooterBadgeSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FooterBadge)
  badges: FooterBadge[];
}

export const FooterSettingsSchema =
  SchemaFactory.createForClass(FooterSettings);

// --- Root Site Settings Document ---

@Schema({ timestamps: true, collection: 'site_settings' })
export class SiteSettings {
  @ApiProperty({ type: String, description: 'Organization ID' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    unique: true,
    index: true,
  })
  organizationId: mongoose.Types.ObjectId;

  @ApiProperty({ type: HeaderSettings })
  @Prop({ type: HeaderSettingsSchema, required: true, default: () => ({}) })
  @ValidateNested()
  @Type(() => HeaderSettings)
  header: HeaderSettings;

  @ApiProperty({ type: FooterSettings })
  @Prop({ type: FooterSettingsSchema, required: true, default: () => ({}) })
  @ValidateNested()
  @Type(() => FooterSettings)
  footer: FooterSettings;
}

export const SiteSettingsSchema = SchemaFactory.createForClass(SiteSettings);

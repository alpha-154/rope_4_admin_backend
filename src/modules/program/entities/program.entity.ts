import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import mongoose, { Document } from 'mongoose';
import { Organization } from '../../organization/entities/organization.entity';

export type ProgramDocument = Program & Document;

export enum ProgramStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum DepartureStatus {
  AVAILABLE = 'available',
  FILLING_FAST = 'filling-fast',
  ALMOST_FULL = 'almost-full',
  SOLD_OUT = 'sold-out',
}

@Schema({ _id: false })
export class ProgramPrice {
  @ApiProperty({ example: 45000, description: 'Base price amount' })
  @Prop({ type: Number, required: true, default: 0 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'BDT', description: 'Currency code' })
  @Prop({ type: String, default: 'BDT' })
  @IsString()
  currency: string;

  @ApiPropertyOptional({
    example: '+ 5% GST',
    description: 'Tax or per-person note',
  })
  @Prop({ type: String, default: 'per person' })
  @IsOptional()
  @IsString()
  taxNote?: string;
}

export const ProgramPriceSchema = SchemaFactory.createForClass(ProgramPrice);

@Schema({ _id: false })
export class ItineraryDay {
  @ApiProperty({ example: 1, description: 'Day number' })
  @Prop({ type: Number, required: true })
  @IsNumber()
  day: number;

  @ApiProperty({
    example: 'Drive from Dehradun to Sankri',
    description: 'Day title',
  })
  @Prop({ type: String, required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Drive through scenic pine forests alongside the Tons river...',
    description: 'Full day description',
  })
  @Prop({ type: String, required: true })
  @IsNotEmpty()
  @IsString()
  description: string;

  @ApiPropertyOptional({ example: '6,400 ft' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  altitude?: string;

  @ApiPropertyOptional({ example: '210 km (8 hrs drive)' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  distance?: string;

  @ApiPropertyOptional({ example: 'Guest house / Homestay' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  stay?: string;

  @ApiPropertyOptional({ example: 'Dinner included' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  meals?: string;
}

export const ItineraryDaySchema = SchemaFactory.createForClass(ItineraryDay);

@Schema({ _id: false })
export class ProgramDeparture {
  @ApiProperty({
    example: '2026-12-10T00:00:00.000Z',
    description: 'Trip start date',
  })
  @Prop({ type: Date, required: true })
  @IsDateString()
  startDate: Date;

  @ApiProperty({
    example: '2026-12-16T00:00:00.000Z',
    description: 'Trip end date',
  })
  @Prop({ type: Date, required: true })
  @IsDateString()
  endDate: Date;

  @ApiProperty({ example: 15, description: 'Total slots' })
  @Prop({ type: Number, default: 16 })
  @IsNumber()
  seatsTotal: number;

  @ApiProperty({ example: 4, description: 'Confirmed bookings' })
  @Prop({ type: Number, default: 0 })
  @IsNumber()
  seatsBooked: number;

  @ApiPropertyOptional({
    example: 42000,
    description: 'Special seasonal price',
  })
  @Prop({ type: Number })
  @IsOptional()
  @IsNumber()
  priceOverride?: number;

  @ApiProperty({ enum: DepartureStatus, default: DepartureStatus.AVAILABLE })
  @Prop({
    type: String,
    enum: DepartureStatus,
    default: DepartureStatus.AVAILABLE,
  })
  @IsEnum(DepartureStatus)
  status: DepartureStatus;
}

export const ProgramDepartureSchema =
  SchemaFactory.createForClass(ProgramDeparture);

@Schema({ _id: false })
export class ProgramSeo {
  @ApiPropertyOptional({ example: 'Kedarkantha Trek | Rope4 Wilderness' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    example:
      'Summit Kedarkantha peak with certified mountaineering instructors.',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/og-kedarkantha.jpg' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  ogImage?: string;
}

export const ProgramSeoSchema = SchemaFactory.createForClass(ProgramSeo);

@Schema({ _id: false })
export class GeoLocation {
  @ApiProperty({ example: 'Point', enum: ['Point'] })
  @Prop({ type: String, enum: ['Point'], default: 'Point' })
  @IsOptional()
  @IsIn(['Point'])
  type?: string;

  @ApiProperty({
    example: [78.18, 31.07],
    description: '[Longitude, Latitude]',
  })
  @Prop({ type: [Number], required: true, default: [0, 0] })
  @IsArray()
  @IsNumber({}, { each: true })
  coordinates: number[];
}

export const GeoLocationSchema = SchemaFactory.createForClass(GeoLocation);

@Schema({ _id: false })
export class ProgramFaq {
  @ApiProperty({ example: 'What is the minimum age?' })
  @Prop({ type: String, required: true })
  @IsString()
  question: string;

  @ApiProperty({ example: '10 years accompanied by parent or guardian.' })
  @Prop({ type: String, required: true })
  @IsString()
  answer: string;
}

export const ProgramFaqSchema = SchemaFactory.createForClass(ProgramFaq);

@Schema({
  timestamps: true,
  collection: 'programs',
  toJSON: { virtuals: true },
})
export class Program {
  @ApiProperty({ description: 'Organization reference ID' })
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: Organization.name,
    required: true,
    index: true,
  })
  @IsMongoId()
  organizationId: string;

  @ApiProperty({ example: 'Kedarkantha Winter Summit Trek' })
  @Prop({ type: String, required: true, trim: true, index: true })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'kedarkantha-winter-summit-trek' })
  @Prop({ type: String, required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiProperty({
    example: 'Trek',
    description:
      'Category e.g. Trek, Premium Trip, Summer Camp, Learning Program',
  })
  @Prop({ type: String, required: true, trim: true, index: true })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: 'India' })
  @Prop({ type: String, required: true, trim: true, index: true })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: 'Uttarakhand' })
  @Prop({ type: String, required: true, trim: true, index: true })
  @IsNotEmpty()
  @IsString()
  region: string;

  @ApiProperty({
    example: 'Classic Himalayan snow trek with 360-degree summit views.',
  })
  @Prop({ type: String, required: true, trim: true })
  @IsNotEmpty()
  @IsString()
  shortDescription: string;

  @ApiPropertyOptional({
    example: '<p>Comprehensive trek overview and historical background...</p>',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Best Seller' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiProperty({ type: [String], example: ['/uploads/programs/hero1.jpg'] })
  @Prop({ type: [String], default: [] })
  @IsArray()
  heroImages: string[];

  @ApiProperty({ type: [String], example: ['/uploads/programs/gallery1.jpg'] })
  @Prop({ type: [String], default: [] })
  @IsArray()
  gallery: string[];

  @ApiProperty({ example: 6, description: 'Duration in days' })
  @Prop({ type: Number, required: true, index: true })
  @IsNumber()
  duration: number;

  @ApiProperty({
    example: 'Easy to Moderate',
    description: 'Grade / Difficulty level',
  })
  @Prop({ type: String, required: true, index: true })
  @IsNotEmpty()
  @IsString()
  difficulty: string;

  @ApiPropertyOptional({ example: '12,500 ft' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  maxAltitude?: string;

  @ApiPropertyOptional({ example: '24 km' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  distance?: string;

  @ApiProperty({ type: [String], example: ['Winter', 'Spring'] })
  @Prop({ type: [String], default: [] })
  @IsArray()
  season: string[];

  @ApiProperty({
    type: [String],
    example: ['December', 'January', 'February', 'March', 'April'],
  })
  @Prop({ type: [String], default: [] })
  @IsArray()
  months: string[];

  @ApiPropertyOptional({ example: 'Sankri' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  baseCamp?: string;

  @ApiPropertyOptional({ example: 'Dehradun ISBT / Railway Station' })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  startPoint?: string;

  @ApiPropertyOptional({
    example: 'Guesthouse on Day 1 & 5; alpine 4-season tents on trek days',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  accommodation?: string;

  @ApiPropertyOptional({
    example:
      'Wholesome hot meals (vegetarian with eggs) prepared fresh at campsites',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  food?: string;

  @ApiPropertyOptional({
    example: 'Non-AC Tata Sumo / Bolero or Tempo Traveler from pickup hub',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  transport?: string;

  @ApiProperty({ type: [ItineraryDay] })
  @Prop({ type: [ItineraryDaySchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryDay)
  itinerary: ItineraryDay[];

  @ApiPropertyOptional({
    example:
      'Basic physical fitness. Ability to run 4-5 km comfortably in under 35 minutes.',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  eligibility?: string;

  @ApiPropertyOptional({
    example:
      'Fly to Jolly Grant Airport Dehradun or take the overnight train from Delhi...',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  howToReach?: string;

  @ApiProperty({
    type: [String],
    example: [
      'Certified Mountain Guides',
      'Trek permits and forest entry',
      'Quality mountaineering equipment',
    ],
  })
  @Prop({ type: [String], default: [] })
  @IsArray()
  costIncludes: string[];

  @ApiProperty({
    type: [String],
    example: [
      'Personal gear / clothing',
      'Mule or porter hire for offloading backpack',
      'Emergency rescue expenses',
    ],
  })
  @Prop({ type: [String], default: [] })
  @IsArray()
  costExcludes: string[];

  @ApiPropertyOptional({
    example:
      'Up to 30 days prior: 90% refund. 15-29 days: 50% refund. Under 15 days: No refund.',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiProperty({
    type: [String],
    example: [
      'Warm thermal base layers',
      'Waterproof trekking boots',
      'Headlamp with extra batteries',
    ],
  })
  @Prop({ type: [String], default: [] })
  @IsArray()
  essentials: string[];

  @ApiPropertyOptional({
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  })
  @Prop({ type: String, default: '' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ type: ProgramPrice })
  @Prop({ type: ProgramPriceSchema, required: true })
  @ValidateNested()
  @Type(() => ProgramPrice)
  price: ProgramPrice;

  @ApiProperty({ type: [ProgramDeparture] })
  @Prop({ type: [ProgramDepartureSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramDeparture)
  departures: ProgramDeparture[];

  @ApiPropertyOptional({ type: [ProgramFaq] })
  @Prop({ type: [ProgramFaqSchema], default: [] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramFaq)
  faqs: ProgramFaq[];

  @ApiPropertyOptional({ type: ProgramSeo })
  @Prop({ type: ProgramSeoSchema, default: () => ({}) })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProgramSeo)
  seo?: ProgramSeo;

  @ApiPropertyOptional({ type: GeoLocation })
  @Prop({
    type: GeoLocationSchema,
    default: { type: 'Point', coordinates: [0, 0] },
  })
  @IsOptional()
  location?: GeoLocation;

  @ApiPropertyOptional({ example: true, default: false })
  @Prop({ type: Boolean, default: false, index: true })
  @IsOptional()
  @IsBoolean()
  isFeatured: boolean;

  @ApiProperty({ enum: ProgramStatus, default: ProgramStatus.DRAFT })
  @Prop({
    type: String,
    enum: ProgramStatus,
    default: ProgramStatus.DRAFT,
    index: true,
  })
  @IsEnum(ProgramStatus)
  status: ProgramStatus;
}

export const ProgramSchema = SchemaFactory.createForClass(Program);

// Compound and geospatial indexes
ProgramSchema.index({ organizationId: 1, slug: 1 }, { unique: true });
ProgramSchema.index({ organizationId: 1, status: 1, isFeatured: 1 });
ProgramSchema.index({ location: '2dsphere' });
ProgramSchema.index({
  title: 'text',
  shortDescription: 'text',
  country: 'text',
  region: 'text',
  category: 'text',
});

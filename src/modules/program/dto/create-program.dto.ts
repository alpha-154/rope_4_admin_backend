import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import {
  DepartureStatus,
  GeoLocation,
  ItineraryDay,
  ProgramDeparture,
  ProgramFaq,
  ProgramPrice,
  ProgramSeo,
  ProgramStatus,
} from '../entities/program.entity';

export class CreateProgramDto {
  @ApiProperty({ example: 'Kedarkantha Winter Summit Trek' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({ example: 'kedarkantha-winter-summit-trek' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'Trek' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiProperty({ example: 'India' })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ApiProperty({ example: 'Uttarakhand' })
  @IsNotEmpty()
  @IsString()
  region: string;

  @ApiProperty({ example: 'Classic Himalayan snow trek with 360-degree summit views.' })
  @IsNotEmpty()
  @IsString()
  shortDescription: string;

  @ApiPropertyOptional({ example: '<p>Comprehensive trek overview...</p>' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'Best Seller' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  heroImages?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  gallery?: string[];

  @ApiProperty({ example: 6 })
  @IsNotEmpty()
  @IsNumber()
  duration: number;

  @ApiProperty({ example: 'Easy to Moderate' })
  @IsNotEmpty()
  @IsString()
  difficulty: string;

  @ApiPropertyOptional({ example: '12,500 ft' })
  @IsOptional()
  @IsString()
  maxAltitude?: string;

  @ApiPropertyOptional({ example: '24 km' })
  @IsOptional()
  @IsString()
  distance?: string;

  @ApiPropertyOptional({ type: [String], example: ['Winter', 'Spring'] })
  @IsOptional()
  @IsArray()
  season?: string[];

  @ApiPropertyOptional({ type: [String], example: ['December', 'January', 'February'] })
  @IsOptional()
  @IsArray()
  months?: string[];

  @ApiPropertyOptional({ example: 'Sankri' })
  @IsOptional()
  @IsString()
  baseCamp?: string;

  @ApiPropertyOptional({ example: 'Dehradun ISBT / Railway Station' })
  @IsOptional()
  @IsString()
  startPoint?: string;

  @ApiPropertyOptional({ example: 'Guesthouse & Alpine tents' })
  @IsOptional()
  @IsString()
  accommodation?: string;

  @ApiPropertyOptional({ example: 'Nutritious hot vegetarian meals with eggs' })
  @IsOptional()
  @IsString()
  food?: string;

  @ApiPropertyOptional({ example: 'Tempo traveler or SUV from Dehradun' })
  @IsOptional()
  @IsString()
  transport?: string;

  @ApiPropertyOptional({ type: [ItineraryDay] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItineraryDay)
  itinerary?: ItineraryDay[];

  @ApiPropertyOptional({ example: 'Basic fitness. Ability to run 4km comfortably.' })
  @IsOptional()
  @IsString()
  eligibility?: string;

  @ApiPropertyOptional({ example: 'Fly to Dehradun Jolly Grant airport...' })
  @IsOptional()
  @IsString()
  howToReach?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  costIncludes?: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  costExcludes?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  cancellationPolicy?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  essentials?: string[];

  @ApiPropertyOptional({ example: 'https://www.youtube.com/watch?v=xyz' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ type: ProgramPrice })
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => ProgramPrice)
  price: ProgramPrice;

  @ApiPropertyOptional({ type: [ProgramDeparture] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramDeparture)
  departures?: ProgramDeparture[];

  @ApiPropertyOptional({ type: [ProgramFaq] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProgramFaq)
  faqs?: ProgramFaq[];

  @ApiPropertyOptional({ type: ProgramSeo })
  @IsOptional()
  @ValidateNested()
  @Type(() => ProgramSeo)
  seo?: ProgramSeo;

  @ApiPropertyOptional({ type: GeoLocation })
  @IsOptional()
  @ValidateNested()
  @Type(() => GeoLocation)
  location?: GeoLocation;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ enum: ProgramStatus, default: ProgramStatus.DRAFT })
  @IsOptional()
  @IsEnum(ProgramStatus)
  status?: ProgramStatus;
}


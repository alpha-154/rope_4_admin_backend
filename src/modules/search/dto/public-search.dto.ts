import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';

export enum SearchResultType {
  ALL = 'all',
  PROGRAMS = 'programs',
  NEWS = 'news',
  FAQS = 'faqs',
}

export class PublicSearchDto {
  @ApiPropertyOptional({ example: 'Himalaya' })
  @IsOptional()
  @IsString()
  q?: string;

  @ApiPropertyOptional({ example: 'Trek' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'India' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ example: 'Moderate' })
  @IsOptional()
  @IsString()
  difficulty?: string;

  @ApiPropertyOptional({ example: 'Winter' })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional({ example: 'December' })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    example: '78.18,31.07,150000',
    description: 'Format: lng,lat,maxDistanceMeters',
  })
  @IsOptional()
  @IsString()
  near?: string;

  @ApiPropertyOptional({
    enum: SearchResultType,
    default: SearchResultType.ALL,
  })
  @IsOptional()
  @IsEnum(SearchResultType)
  type?: SearchResultType;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 12 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

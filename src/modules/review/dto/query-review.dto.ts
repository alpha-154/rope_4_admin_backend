import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsEnum, IsNumber, IsOptional, IsString } from 'class-validator';
import { ReviewSource } from '../entities/review.entity';

export class QueryPublicReviewsDto {
  @ApiPropertyOptional({ enum: ReviewSource })
  @IsOptional()
  @IsEnum(ReviewSource)
  source?: ReviewSource;

  @ApiPropertyOptional({ example: '659fa4219...' })
  @IsOptional()
  @IsString()
  programId?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}

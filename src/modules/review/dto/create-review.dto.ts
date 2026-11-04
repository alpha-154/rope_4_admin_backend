import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { ReviewSource, ReviewStatus } from '../entities/review.entity';

export class CreateReviewDto {
  @ApiProperty({ example: 'Tahsin Ahmed' })
  @IsNotEmpty()
  @IsString()
  author: string;

  @ApiPropertyOptional({ example: '/uploads/avatars/user.jpg' })
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiProperty({ example: 5 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({ example: '2026-10-15' })
  @IsOptional()
  @IsDateString()
  date?: Date;

  @ApiProperty({
    example: 'Exceptional expedition leaders! High safety standards.',
  })
  @IsNotEmpty()
  @IsString()
  text: string;

  @ApiPropertyOptional({ enum: ReviewSource, default: ReviewSource.GOOGLE })
  @IsOptional()
  @IsEnum(ReviewSource)
  source?: ReviewSource;

  @ApiPropertyOptional({ example: 'https://youtube.com/watch?v=xyz' })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiPropertyOptional({ example: '659fa4219...' })
  @IsOptional()
  @IsMongoId()
  programId?: string;

  @ApiPropertyOptional({ example: 'Kedarkantha Winter Summit Trek' })
  @IsOptional()
  @IsString()
  programTitle?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiPropertyOptional({ enum: ReviewStatus, default: ReviewStatus.APPROVED })
  @IsOptional()
  @IsEnum(ReviewStatus)
  status?: ReviewStatus;
}

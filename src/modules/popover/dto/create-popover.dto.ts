import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { PopoverCta, PopoverFrequency, PopoverType } from '../entities/popover.entity';

export class CreatePopoverDto {
  @ApiProperty({ enum: PopoverType, default: PopoverType.MODAL })
  @IsEnum(PopoverType)
  type: PopoverType;

  @ApiProperty({ example: 'Winter Trek Early Bird Offer' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: 'Book before Nov 30 to claim your 15% discount.' })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ type: PopoverCta })
  @IsOptional()
  @ValidateNested()
  @Type(() => PopoverCta)
  cta?: PopoverCta;

  @ApiPropertyOptional({ example: '/uploads/popovers/early-bird.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 'all' })
  @IsOptional()
  @IsString()
  pageTargeting?: string;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  triggerDelay?: number;

  @ApiPropertyOptional({ enum: PopoverFrequency, default: PopoverFrequency.ALWAYS })
  @IsOptional()
  @IsEnum(PopoverFrequency)
  displayFrequency?: PopoverFrequency;

  @ApiPropertyOptional({ example: '2026-11-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: Date;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

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
import { HighlightItem } from '../entities/highlight.entity';

export class CreateHighlightDto {
  @ApiProperty({
    example: 'why-choose-us',
    description: 'Section identifier key',
  })
  @IsNotEmpty()
  @IsString()
  sectionKey: string;

  @ApiProperty({ example: 'why-choose-us', description: 'Section slug' })
  @IsNotEmpty()
  @IsString()
  slug: string;

  @ApiPropertyOptional({ example: 'Why Choose Us' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ example: 'India and Global Mountain Experts' })
  @IsOptional()
  @IsString()
  sectionTitle?: string;

  @ApiPropertyOptional({
    example: 'Pioneers in high-altitude treks and wilderness survival.',
  })
  @IsOptional()
  @IsString()
  sectionDescription?: string;

  @ApiProperty({
    type: [HighlightItem],
    description: 'Items in this highlight section',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HighlightItem)
  items: HighlightItem[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

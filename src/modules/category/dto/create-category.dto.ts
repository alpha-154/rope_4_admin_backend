import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Summer Camp' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(80)
  name: string;

  @ApiPropertyOptional({
    example: 'summer-camp',
    description: 'Generated from name when omitted',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'slug may contain only lowercase letters, numbers and hyphens',
  })
  slug?: string;

  @ApiPropertyOptional({ example: 'Youth wilderness survival camps' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/photo-...' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

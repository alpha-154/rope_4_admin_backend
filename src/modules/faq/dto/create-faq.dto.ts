import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FaqItem } from '../entities/faq.entity';

export class CreateFaqDto {
  @ApiPropertyOptional({
    description:
      'FAQ category id (preferred). Either categoryId or category is required.',
  })
  @IsOptional()
  @IsMongoId()
  categoryId?: string;

  @ApiPropertyOptional({
    example: 'Beginners Guide',
    description:
      'FAQ category name (legacy; matched or created when categoryId is absent)',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    example: 'beginners-guide',
    description: 'URL-friendly slug',
  })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ type: [FaqItem], description: 'List of Q&A items' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FaqItem)
  faqs: FaqItem[];

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

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
import { FaqItem } from '../entities/faq.entity';

export class CreateFaqDto {
  @ApiProperty({ example: 'Beginners Guide', description: 'FAQ Category name' })
  @IsNotEmpty()
  @IsString()
  category: string;

  @ApiPropertyOptional({ example: 'beginners-guide', description: 'URL-friendly slug' })
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


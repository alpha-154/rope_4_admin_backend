import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { HighlightItem } from '../entities/highlight.entity';

export class CreateHighlightDto {
  @ApiPropertyOptional({ example: 'Wilderness Safety & Instruction' })
  @IsOptional()
  @IsString()
  badge?: string;

  @ApiPropertyOptional({ example: 'Why Learn & Trek With Rope4?' })
  @IsOptional()
  @IsString()
  sectionTitle?: string;

  @ApiPropertyOptional({
    example: 'We operate under the strictest mountaineering safety guidelines.',
  })
  @IsOptional()
  @IsString()
  sectionDescription?: string;

  @ApiProperty({
    type: [HighlightItem],
    description: 'Highlight cards / stats',
  })
  @IsArray()
  @ArrayMinSize(1)
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

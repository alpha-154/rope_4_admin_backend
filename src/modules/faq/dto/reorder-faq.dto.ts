import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReorderFaqDto {
  @ApiPropertyOptional({
    example: '659fa4219...',
    description: 'ID of previous item',
  })
  @IsOptional()
  @IsString()
  prevId?: string;

  @ApiPropertyOptional({
    example: '659fa4219...',
    description: 'ID of next item',
  })
  @IsOptional()
  @IsString()
  nextId?: string;
}

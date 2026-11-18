import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateFaqCategoryDto {
  @ApiProperty({ example: 'Safety & Medical' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(60)
  name: string;
}

export class UpdateFaqCategoryDto extends PartialType(CreateFaqCategoryDto) {}

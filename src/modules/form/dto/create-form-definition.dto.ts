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
import { FormField } from '../entities/form-definition.entity';

export class CreateFormDefinitionDto {
  @ApiProperty({ example: 'General Contact Us' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'contact-us' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiPropertyOptional({ example: 'Website visitor inquiry form' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [FormField] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FormField)
  fields: FormField[];

  @ApiPropertyOptional({ example: ['support@rope4.org'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  notificationEmails?: string[];

  @ApiPropertyOptional({ example: 'Thank you for reaching out to Rope4!' })
  @IsOptional()
  @IsString()
  confirmationSubject?: string;

  @ApiPropertyOptional({
    example: 'We have received your message and will reply within 24 hours.',
  })
  @IsOptional()
  @IsString()
  confirmationMessage?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

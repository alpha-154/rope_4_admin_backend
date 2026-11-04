import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SocialLinksDto {
  @ApiPropertyOptional({ example: 'https://facebook.com/rope4' })
  @IsOptional()
  @IsString()
  facebook?: string;

  @ApiPropertyOptional({ example: 'https://instagram.com/rope4' })
  @IsOptional()
  @IsString()
  instagram?: string;

  @ApiPropertyOptional({ example: 'https://youtube.com/@rope4' })
  @IsOptional()
  @IsString()
  youtube?: string;

  @ApiPropertyOptional({ example: 'https://linkedin.com/company/rope4' })
  @IsOptional()
  @IsString()
  linkedin?: string;
}

export class OrgSettingsDto {
  @ApiPropertyOptional({ example: 'BDT' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ example: 'Asia/Dhaka' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  defaultTaxPercent?: number;
}

export class CreateOrganizationDto {
  @ApiProperty({ example: 'Rope4 Outdoor Education' })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'rope4' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'contact@rope4.org' })
  @IsNotEmpty()
  @IsEmail()
  contactEmail: string;

  @ApiPropertyOptional({ example: '+880 1700-000000' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Dhaka, Bangladesh' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'https://rope4.org/logo.png' })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({ type: SocialLinksDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => SocialLinksDto)
  socialLinks?: SocialLinksDto;

  @ApiPropertyOptional({ type: OrgSettingsDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => OrgSettingsDto)
  settings?: OrgSettingsDto;
}

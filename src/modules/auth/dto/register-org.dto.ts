import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class RegisterOwnerDto {
  @ApiProperty({ example: 'Mohiuddin' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Mahi' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ example: 'admin@rope4.org' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'admin123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+880 1700-000000' })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class RegisterOrgDto {
  @ApiProperty({ example: 'Rope4 Outdoor Education' })
  @IsString()
  @IsNotEmpty()
  organizationName: string;

  @ApiPropertyOptional({ example: 'rope4' })
  @IsOptional()
  @IsString()
  slug?: string;

  @ApiProperty({ example: 'contact@rope4.org' })
  @IsEmail()
  @IsNotEmpty()
  contactEmail: string;

  @ApiPropertyOptional({ example: '+880 1700-000000' })
  @IsOptional()
  @IsString()
  contactPhone?: string;

  @ApiPropertyOptional({ example: 'Dhaka, Bangladesh' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ type: RegisterOwnerDto })
  @ValidateNested()
  @Type(() => RegisterOwnerDto)
  owner: RegisterOwnerDto;
}

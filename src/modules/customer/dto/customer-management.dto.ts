import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class ShippingAddressDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: 'Home' })
  @IsOptional()
  @IsString()
  label?: string;

  @ApiPropertyOptional({ example: 'House 12, Road 4, Dhanmondi' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiPropertyOptional({ example: 'Dhaka' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: 'Dhaka Division' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiPropertyOptional({ example: '1205' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiPropertyOptional({ example: 'Bangladesh' })
  @IsOptional()
  @IsString()
  country?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateCustomerProfileDto {
  @ApiPropertyOptional({ example: 'Tanvir' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Ahmed' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '+8801711223344' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  avatar?: string;

  @ApiPropertyOptional({ type: [ShippingAddressDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShippingAddressDto)
  shippingAddresses?: ShippingAddressDto[];
}

export class ToggleWishlistDto {
  @ApiPropertyOptional({ description: 'ID of Program or Product' })
  @IsMongoId()
  @IsNotEmpty()
  itemId: string;
}

export class QueryCustomerDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Search name, email, or phone' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['all', 'active', 'blocked'] })
  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateCustomerStatusDto {
  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

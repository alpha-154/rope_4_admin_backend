import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../entities/order.entity';

export class OrderShippingAddressDto {
  @ApiProperty({ example: 'House 12, Road 4, Dhanmondi' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Dhaka' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiPropertyOptional({ example: 'Dhaka Division' })
  @IsOptional()
  @IsString()
  state?: string;

  @ApiProperty({ example: '1205' })
  @IsString()
  @IsNotEmpty()
  postalCode: string;

  @ApiPropertyOptional({ example: 'Bangladesh' })
  @IsOptional()
  @IsString()
  country?: string;
}

export class OrderItemInputDto {
  @ApiProperty({ description: 'Target Product ID' })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiPropertyOptional({ example: { size: '55L', color: 'Black' } })
  @IsOptional()
  variant?: { size?: string; color?: string };
}

export class CreateOrderDto {
  @ApiProperty({ example: 'traveler@gmail.com' })
  @IsEmail()
  @IsNotEmpty()
  customerEmail: string;

  @ApiProperty({ example: 'Tanvir Ahmed' })
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({ example: '+8801711223344' })
  @IsString()
  @IsNotEmpty()
  customerPhone: string;

  @ApiProperty({ type: OrderShippingAddressDto })
  @ValidateNested()
  @Type(() => OrderShippingAddressDto)
  @IsNotEmpty()
  shippingAddress: OrderShippingAddressDto;

  @ApiProperty({ type: [OrderItemInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemInputDto)
  items: OrderItemInputDto[];

  @ApiPropertyOptional({ enum: PaymentMethod, default: PaymentMethod.COD })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod = PaymentMethod.COD;

  @ApiPropertyOptional({
    example: 'Please leave with reception if unavailable',
  })
  @IsOptional()
  @IsString()
  customerNotes?: string;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({ example: 'Dispatched via Courier Tracking #TRK-9901' })
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;

  @ApiPropertyOptional({ example: 'Internal warehouse verification complete' })
  @IsOptional()
  @IsString()
  adminNotes?: string;
}

export class QueryOrderDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 15 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 15;

  @ApiPropertyOptional({
    description: 'Search order number, customer name, email, or phone',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ enum: PaymentStatus })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}

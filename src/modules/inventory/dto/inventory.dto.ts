import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { StockMovementType } from '../entities/stock-movement.entity';

export class AdjustInventoryDto {
  @ApiProperty({ description: 'Target Product ID' })
  @IsMongoId()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    enum: [
      StockMovementType.PURCHASE_RECEIPT,
      StockMovementType.MANUAL_ADJUSTMENT,
      StockMovementType.DAMAGE_DISCARD,
      StockMovementType.RETURN_RESTOCK,
    ],
    example: StockMovementType.MANUAL_ADJUSTMENT,
  })
  @IsEnum(StockMovementType)
  type: StockMovementType;

  @ApiProperty({
    example: 10,
    description:
      'Units to add (positive) or deduct (negative). For MANUAL_ADJUSTMENT can be relative delta or set direct.',
  })
  @IsNumber()
  quantityChange: number;

  @ApiPropertyOptional({
    example: 'Physical stock recount matched with warehouse shelf 3',
  })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ example: 'PO-2026-088' })
  @IsOptional()
  @IsString()
  referenceId?: string;
}

export class QueryStockMovementDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  productId?: string;

  @ApiPropertyOptional({ enum: StockMovementType })
  @IsOptional()
  @IsEnum(StockMovementType)
  type?: StockMovementType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;
}

export class QueryInventoryDto {
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

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: ['all', 'inStock', 'lowStock', 'outOfStock'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

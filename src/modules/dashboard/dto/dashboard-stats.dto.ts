import { ApiProperty } from '@nestjs/swagger';

export class PeriodComparisonDto {
  @ApiProperty({ description: 'Count in the current window (last N days)' })
  current: number;

  @ApiProperty({ description: 'Count in the previous window of equal length' })
  previous: number;

  @ApiProperty({
    description:
      'Percent change vs previous window, rounded. null when previous is 0',
    nullable: true,
    type: Number,
  })
  changePercent: number | null;
}

export class ProgramStatsDto {
  @ApiProperty({ description: 'Published programs' })
  active: number;

  @ApiProperty({ description: 'All programs (any status)' })
  total: number;

  @ApiProperty({ type: PeriodComparisonDto, description: 'Programs created' })
  created: PeriodComparisonDto;
}

export class ProductStatsDto {
  @ApiProperty({ description: 'Non-deleted products' })
  total: number;

  @ApiProperty()
  published: number;

  @ApiProperty({ description: 'In stock but at/below lowStockThreshold' })
  lowStock: number;

  @ApiProperty({ description: 'stockQuantity = 0' })
  outOfStock: number;

  @ApiProperty({ type: PeriodComparisonDto, description: 'Products created' })
  created: PeriodComparisonDto;
}

export class OrderStatsDto {
  @ApiProperty({ type: PeriodComparisonDto, description: 'Orders placed' })
  placed: PeriodComparisonDto;

  @ApiProperty({
    description: 'Revenue (excl. cancelled) in the current window',
  })
  revenue: number;

  @ApiProperty({ description: 'Orders with status PENDING' })
  pending: number;
}

export class InquiryStatsDto {
  @ApiProperty({ type: PeriodComparisonDto, description: 'Form submissions' })
  received: PeriodComparisonDto;

  @ApiProperty({ description: 'Submissions with status "new" (unread)' })
  unread: number;
}

export class SystemStatusDto {
  @ApiProperty({ example: 'connected' })
  database: string;

  @ApiProperty({ description: 'API process uptime in seconds' })
  uptimeSeconds: number;

  @ApiProperty({ example: 'development' })
  environment: string;

  @ApiProperty({ example: 'Rope4 Outdoor Education' })
  organizationName: string;

  @ApiProperty({ example: 'rope4' })
  organizationSlug: string;

  @ApiProperty({ example: 'http://localhost:3000' })
  websiteUrl: string;

  @ApiProperty()
  generatedAt: string;
}

export class DashboardStatsDto {
  @ApiProperty({ description: 'Length of the comparison window in days' })
  periodDays: number;

  @ApiProperty({ type: ProgramStatsDto })
  programs: ProgramStatsDto;

  @ApiProperty({ type: ProductStatsDto })
  products: ProductStatsDto;

  @ApiProperty({ type: OrderStatsDto })
  orders: OrderStatsDto;

  @ApiProperty({ type: InquiryStatsDto })
  inquiries: InquiryStatsDto;

  @ApiProperty({ type: SystemStatusDto })
  system: SystemStatusDto;
}

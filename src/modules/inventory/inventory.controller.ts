import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authorization } from '@/common/decorators/authorization.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { GetOrgId } from '@/common/decorators/get-organizationId.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { IApiResponse } from '@/common/interfaces/api-response.interface';
import {
  TokenPayload,
  UserRole,
} from '@/common/interfaces/token-payload.interface';
import {
  AdjustInventoryDto,
  QueryInventoryDto,
  QueryStockMovementDto,
} from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('Inventory & Stock Movements')
@Controller('admin/inventory')
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get stock inventory status & summary metrics (Admin)',
  })
  @Get()
  async getInventory(
    @GetOrgId() orgId: string,
    @Query() query: QueryInventoryDto,
  ): Promise<IApiResponse<any>> {
    const data = await this.inventoryService.getInventoryOverview(orgId, query);
    return {
      success: true,
      message: 'Inventory overview retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary:
      'Adjust product stock (Receive stock, Damage discard, Manual recount) (Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Stock adjusted and audit log created',
  })
  @Post('adjust')
  async adjustStock(
    @GetOrgId() orgId: string,
    @CurrentUser() user: TokenPayload,
    @Body() dto: AdjustInventoryDto,
  ): Promise<IApiResponse<any>> {
    const performer =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email;

    const data = await this.inventoryService.adjustStock(orgId, dto, performer);
    return {
      success: true,
      message: 'Stock adjusted successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'View inventory audit trail movements log (Admin)' })
  @Get('movements')
  async getMovements(
    @GetOrgId() orgId: string,
    @Query() query: QueryStockMovementDto,
  ): Promise<IApiResponse<any>> {
    const data = await this.inventoryService.getStockMovements(orgId, query);
    return {
      success: true,
      message: 'Stock movements retrieved successfully',
      data,
    };
  }
}

import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authorization } from '@/common/decorators/authorization.decorator';
import { GetOrgId } from '@/common/decorators/get-organizationId.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { IApiResponse } from '@/common/interfaces/api-response.interface';
import { UserRole } from '@/common/interfaces/token-payload.interface';
import { DashboardService } from './dashboard.service';
import { DashboardStatsDto } from './dto/dashboard-stats.dto';

@ApiTags('Admin Dashboard')
@Controller()
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary:
      'Dashboard metrics (programs, products, orders, inquiries) with 30-day trends and system status',
  })
  @ApiResponse({ status: 200, type: DashboardStatsDto })
  @Get('admin/dashboard/stats')
  async getStats(
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<DashboardStatsDto>> {
    const data = await this.dashboardService.getStats(orgId);
    return {
      success: true,
      message: 'Dashboard statistics retrieved successfully',
      data,
    };
  }
}

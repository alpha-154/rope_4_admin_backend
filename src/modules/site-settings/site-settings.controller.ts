import { Body, Controller, Get, Patch, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authorization } from '../../common/decorators/authorization.decorator';
import { GetOrgId } from '../../common/decorators/get-organizationId.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { IApiResponse } from '../../common/interfaces/api-response.interface';
import { UserRole } from '../../common/interfaces/token-payload.interface';
import { UpdateSiteSettingsDto } from './dto/update-site-settings.dto';
import { SiteSettings } from './entities/site-settings.entity';
import { SiteSettingsService } from './site-settings.service';

@ApiTags('Site Settings')
@Controller()
export class SiteSettingsController {
  constructor(private readonly settingsService: SiteSettingsService) {}

  // --- ADMIN ENDPOINTS ---

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get Header and Footer site settings (Admin)' })
  @ApiResponse({ status: 200, type: SiteSettings })
  @Get('admin/settings/site')
  async getAdminSettings(
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<SiteSettings>> {
    const data = await this.settingsService.getSettings(orgId);
    return {
      success: true,
      message: 'Site settings retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update Header and Footer site settings (Admin)' })
  @ApiResponse({ status: 200, type: SiteSettings })
  @Patch('admin/settings/site')
  async updateAdminSettings(
    @GetOrgId() orgId: string,
    @Body() dto: UpdateSiteSettingsDto,
  ): Promise<IApiResponse<SiteSettings>> {
    const data = await this.settingsService.updateSettings(orgId, dto);
    return {
      success: true,
      message: 'Site settings updated successfully',
      data,
    };
  }

  // --- PUBLIC ENDPOINTS (WEBSITE) ---

  @ApiOperation({
    summary:
      'Get active site navigation, header and footer configuration (Website)',
  })
  @ApiResponse({ status: 200, type: SiteSettings })
  @Get(['public/settings/navigation', 'public/settings/site'])
  async getPublicSettings(
    @GetOrgId({ required: false }) orgId?: string,
    @Query('organizationId') queryOrgId?: string,
  ): Promise<IApiResponse<SiteSettings>> {
    const targetOrgId = orgId || queryOrgId;
    const data = await this.settingsService.getPublicSettings(targetOrgId);
    return {
      success: true,
      message: 'Public navigation and site settings retrieved successfully',
      data,
    };
  }
}

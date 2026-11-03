import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authorization } from '@/common/decorators/authorization.decorator';
import { GetOrgId } from '@/common/decorators/get-organizationId.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { UserRole } from '@/common/interfaces/token-payload.interface';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { Organization } from './entities/organization.entity';
import { OrganizationService } from './organization.service';

@ApiTags('Organization')
@Controller('v1')
export class OrganizationController {
  constructor(private readonly orgService: OrganizationService) {}

  @Get('admin/org/profile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @ApiOperation({ summary: 'Get current organization profile (Admin)' })
  @ApiResponse({ status: 200, type: Organization })
  async getAdminProfile(@GetOrgId() orgId: string) {
    return this.orgService.findById(orgId);
  }

  @Patch('admin/org/profile')
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update organization profile (Admin)' })
  @ApiResponse({ status: 200, type: Organization })
  async updateAdminProfile(
    @GetOrgId() orgId: string,
    @Body() dto: UpdateOrganizationDto,
  ) {
    return this.orgService.update(orgId, dto);
  }

  @Get('public/org/profile')
  @ApiOperation({ summary: 'Get public organization details' })
  @ApiQuery({ name: 'slug', required: false, type: String })
  @ApiResponse({ status: 200, type: Organization })
  async getPublicProfile(
    @Query('slug') slug?: string,
    @GetOrgId() orgId?: string,
  ) {
    if (slug) {
      return this.orgService.findBySlug(slug);
    }
    return this.orgService.findById(orgId || '');
  }
}


import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authorization } from '../../common/decorators/authorization.decorator';
import { GetOrgId } from '../../common/decorators/get-organizationId.decorator';
import { QueryFeatureMultiple } from '../../common/decorators/query-features.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { IApiResponse } from '../../common/interfaces/api-response.interface';
import { IQueryFeatures } from '../../common/interfaces/query-feature.interface';
import { UserRole } from '../../common/interfaces/token-payload.interface';
import { CreatePopoverDto } from './dto/create-popover.dto';
import { UpdatePopoverDto } from './dto/update-popover.dto';
import { Popover } from './entities/popover.entity';
import { PopoverService } from './popover.service';

@ApiTags('Popovers')
@Controller()
export class PopoverController {
  constructor(private readonly popoverService: PopoverService) {}

  // --- ADMIN ENDPOINTS ---

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create popover / floating widget (Admin)' })
  @ApiResponse({ status: 201, type: Popover })
  @Post('popovers')
  async create(
    @GetOrgId() orgId: string,
    @Body() createDto: CreatePopoverDto,
  ): Promise<IApiResponse<Popover>> {
    const data = await this.popoverService.create(orgId, createDto);
    return {
      success: true,
      message: 'Popover created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List all popovers (Admin)' })
  @ApiResponse({ status: 200, type: [Popover] })
  @Get('popovers/admin')
  async findAll(
    @GetOrgId() orgId: string,
    @QueryFeatureMultiple() query: IQueryFeatures,
  ): Promise<IApiResponse<Popover[]>> {
    const result = await this.popoverService.findAll(orgId, query);
    return {
      success: true,
      message: 'Popovers retrieved successfully',
      data: result.data as Popover[],
      meta: {
        page: query.page ?? 1,
        limit: query.limit ?? 10,
        total: result.total,
      },
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get single popover by ID (Admin)' })
  @ApiResponse({ status: 200, type: Popover })
  @Get('popovers/admin/:id')
  async findOne(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<Popover>> {
    const data = await this.popoverService.findOne(id, orgId);
    return {
      success: true,
      message: 'Popover retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update popover configuration (Admin)' })
  @ApiResponse({ status: 200, type: Popover })
  @Patch('popovers/:id')
  async update(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
    @Body() updateDto: UpdatePopoverDto,
  ): Promise<IApiResponse<Popover>> {
    const data = await this.popoverService.update(id, orgId, updateDto);
    return {
      success: true,
      message: 'Popover updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete popover (Admin)' })
  @ApiResponse({ status: 200 })
  @Delete('popovers/:id')
  async remove(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<Popover>> {
    const data = await this.popoverService.remove(id, orgId);
    return {
      success: true,
      message: 'Popover deleted successfully',
      data,
    };
  }

  // --- PUBLIC ENDPOINTS (WEBSITE) ---

  @ApiOperation({ summary: 'Get active popovers for site rendering (Website)' })
  @ApiResponse({ status: 200, type: [Popover] })
  @Get('public/popovers')
  async getActivePopovers(
    @Query('page') page?: string,
  ): Promise<IApiResponse<Popover[]>> {
    const data = await this.popoverService.findActivePopovers(page);
    return {
      success: true,
      message: 'Active popovers retrieved successfully',
      data,
    };
  }
}

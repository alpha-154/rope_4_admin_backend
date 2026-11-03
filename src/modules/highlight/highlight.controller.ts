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
import {
  QueryFeatureMultiple,
} from '../../common/decorators/query-features.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { IApiResponse } from '../../common/interfaces/api-response.interface';
import { IQueryFeatures } from '../../common/interfaces/query-feature.interface';
import { UserRole } from '../../common/interfaces/token-payload.interface';
import { CreateHighlightDto } from './dto/create-highlight.dto';
import { UpdateHighlightDto } from './dto/update-highlight.dto';
import { Highlight } from './entities/highlight.entity';
import { HighlightService } from './highlight.service';

@ApiTags('Highlights')
@Controller('highlights')
export class HighlightController {
  constructor(private readonly highlightService: HighlightService) {}

  // --- ADMIN ENDPOINTS ---

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create highlight section (Admin)' })
  @ApiResponse({ status: 201, type: Highlight })
  @Post()
  async create(
    @GetOrgId() orgId: string,
    @Body() createDto: CreateHighlightDto,
  ): Promise<IApiResponse<Highlight>> {
    const data = await this.highlightService.create(orgId, createDto);
    return {
      success: true,
      message: 'Highlight section created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all highlight sections (Admin)' })
  @ApiResponse({ status: 200, type: [Highlight] })
  @Get('admin')
  async findAll(
    @GetOrgId() orgId: string,
    @QueryFeatureMultiple() query: IQueryFeatures,
  ): Promise<IApiResponse<Highlight[]>> {
    const result = await this.highlightService.findAll(orgId, query);
    return {
      success: true,
      message: 'Highlight sections retrieved successfully',
      data: result.data as Highlight[],
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
  @ApiOperation({ summary: 'Get single highlight section by ID or slug (Admin)' })
  @ApiResponse({ status: 200, type: Highlight })
  @Get('admin/:id')
  async findOne(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<Highlight>> {
    const data = await this.highlightService.findOne(id, orgId);
    return {
      success: true,
      message: 'Highlight section retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update highlight section (Admin)' })
  @ApiResponse({ status: 200, type: Highlight })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
    @Body() updateDto: UpdateHighlightDto,
  ): Promise<IApiResponse<Highlight>> {
    const data = await this.highlightService.update(id, orgId, updateDto);
    return {
      success: true,
      message: 'Highlight section updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete highlight section (Admin)' })
  @ApiResponse({ status: 200 })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<Highlight>> {
    const data = await this.highlightService.remove(id, orgId);
    return {
      success: true,
      message: 'Highlight section deleted successfully',
      data,
    };
  }

  // --- PUBLIC ENDPOINTS (CONSUMED BY WEBSITE) ---

  @ApiOperation({ summary: 'Get public highlight by key/slug (Website)' })
  @ApiResponse({ status: 200, type: Highlight })
  @Get('public/:sectionKey')
  async getPublicHighlight(
    @Param('sectionKey') sectionKey: string,
    @Query('organizationId') organizationId?: string,
  ): Promise<IApiResponse<Highlight>> {
    const data = await this.highlightService.findPublic(sectionKey, organizationId);
    return {
      success: true,
      message: 'Highlight retrieved successfully',
      data,
    };
  }
}

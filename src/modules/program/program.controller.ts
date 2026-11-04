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
import { CreateProgramDto } from './dto/create-program.dto';
import { QueryPublicProgramsDto } from './dto/query-program.dto';
import { UpdateProgramDto } from './dto/update-program.dto';
import { Program } from './entities/program.entity';
import { ProgramService } from './program.service';

@ApiTags('Programs')
@Controller()
export class ProgramController {
  constructor(private readonly programService: ProgramService) {}

  // --- ADMIN ENDPOINTS ---

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create new adventure program / trek (Admin)' })
  @ApiResponse({ status: 201, type: Program })
  @Post('programs')
  async create(
    @GetOrgId() orgId: string,
    @Body() createDto: CreateProgramDto,
  ): Promise<IApiResponse<Program>> {
    const data = await this.programService.create(orgId, createDto);
    return {
      success: true,
      message: 'Program created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List programs for admin management' })
  @ApiResponse({ status: 200, type: [Program] })
  @Get('programs/admin')
  async findAll(
    @GetOrgId() orgId: string,
    @QueryFeatureMultiple() query: IQueryFeatures,
  ): Promise<IApiResponse<Program[]>> {
    const result = await this.programService.findAll(orgId, query);
    return {
      success: true,
      message: 'Programs retrieved successfully',
      data: result.data as Program[],
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
  @ApiOperation({ summary: 'Get single program details by ID (Admin)' })
  @ApiResponse({ status: 200, type: Program })
  @Get('programs/admin/:id')
  async findOne(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<Program>> {
    const data = await this.programService.findOne(id, orgId);
    return {
      success: true,
      message: 'Program retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update program (Admin)' })
  @ApiResponse({ status: 200, type: Program })
  @Patch('programs/:id')
  async update(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
    @Body() updateDto: UpdateProgramDto,
  ): Promise<IApiResponse<Program>> {
    const data = await this.programService.update(id, orgId, updateDto);
    return {
      success: true,
      message: 'Program updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete program (Admin)' })
  @ApiResponse({ status: 200 })
  @Delete('programs/:id')
  async remove(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<Program>> {
    const data = await this.programService.remove(id, orgId);
    return {
      success: true,
      message: 'Program deleted successfully',
      data,
    };
  }

  // --- PUBLIC ENDPOINTS (WEBSITE) ---

  @ApiOperation({ summary: 'Get published programs with filter chips and search (Website)' })
  @ApiResponse({ status: 200, type: [Program] })
  @Get('public/programs')
  async getPublicPrograms(
    @Query() queryDto: QueryPublicProgramsDto,
  ): Promise<IApiResponse<Program[]>> {
    const result = await this.programService.findPublicPrograms(queryDto);
    return {
      success: true,
      message: 'Public programs retrieved successfully',
      data: result.data as Program[],
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    };
  }

  @ApiOperation({ summary: 'Get single published program by slug (Website)' })
  @ApiResponse({ status: 200, type: Program })
  @Get('public/programs/:slug')
  async getPublicProgramBySlug(
    @Param('slug') slug: string,
  ): Promise<IApiResponse<Program>> {
    const data = await this.programService.findPublicProgramBySlug(slug);
    return {
      success: true,
      message: 'Program detail retrieved successfully',
      data,
    };
  }
}

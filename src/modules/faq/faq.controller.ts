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
import { CreateFaqDto } from './dto/create-faq.dto';
import { ReorderFaqDto } from './dto/reorder-faq.dto';
import { UpdateFaqDto } from './dto/update-faq.dto';
import { Faq } from './entities/faq.entity';
import { FaqService } from './faq.service';

@ApiTags('FAQs')
@Controller('faqs')
export class FaqController {
  constructor(private readonly faqService: FaqService) {}

  // --- ADMIN ENDPOINTS ---

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create FAQ category and questions (Admin)' })
  @ApiResponse({ status: 201, type: Faq })
  @Post()
  async create(
    @GetOrgId() orgId: string,
    @Body() createFaqDto: CreateFaqDto,
  ): Promise<IApiResponse<Faq>> {
    const data = await this.faqService.create(orgId, createFaqDto);
    return {
      success: true,
      message: 'FAQ category created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get all FAQs (Admin)' })
  @ApiResponse({ status: 200, type: [Faq] })
  @Get('admin')
  async findAll(
    @GetOrgId() orgId: string,
    @QueryFeatureMultiple() query: IQueryFeatures,
  ): Promise<IApiResponse<Faq[]>> {
    // default sort by fractional index if no sort specified
    if (!query.sort || Object.keys(query.sort).length === 0 || query.sort.createdAt) {
      query.sort = { index: 1 };
    }
    const result = await this.faqService.findAll(orgId, query);
    return {
      success: true,
      message: 'FAQs retrieved successfully',
      data: result.data as Faq[],
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
  @ApiOperation({ summary: 'Get single FAQ category by ID or slug (Admin)' })
  @ApiResponse({ status: 200, type: Faq })
  @Get('admin/:id')
  async findOne(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<Faq>> {
    const data = await this.faqService.findOne(id, orgId);
    return {
      success: true,
      message: 'FAQ category retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update FAQ category (Admin)' })
  @ApiResponse({ status: 200, type: Faq })
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
    @Body() updateFaqDto: UpdateFaqDto,
  ): Promise<IApiResponse<Faq>> {
    const data = await this.faqService.update(id, orgId, updateFaqDto);
    return {
      success: true,
      message: 'FAQ category updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Reorder FAQ category using fractional indexing (Admin)' })
  @ApiResponse({ status: 200, type: Faq })
  @Patch(':id/reorder')
  async reorder(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
    @Body() reorderDto: ReorderFaqDto,
  ): Promise<IApiResponse<Faq>> {
    const data = await this.faqService.reorder(id, orgId, reorderDto);
    return {
      success: true,
      message: 'FAQ category reordered successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete FAQ category (Admin)' })
  @ApiResponse({ status: 200 })
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<Faq>> {
    const data = await this.faqService.remove(id, orgId);
    return {
      success: true,
      message: 'FAQ category deleted successfully',
      data,
    };
  }

  // --- PUBLIC ENDPOINTS (WEBSITE) ---

  @ApiOperation({ summary: 'Get all public FAQs (Website)' })
  @ApiResponse({ status: 200, type: [Faq] })
  @Get('public')
  async getPublicFaqs(
    @Query('organizationId') organizationId?: string,
  ): Promise<IApiResponse<Faq[]>> {
    const data = await this.faqService.findPublic(organizationId);
    return {
      success: true,
      message: 'Public FAQs retrieved successfully',
      data,
    };
  }
}

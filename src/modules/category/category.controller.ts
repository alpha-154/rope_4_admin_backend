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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Authorization } from '../../common/decorators/authorization.decorator';
import { GetOrgId } from '../../common/decorators/get-organizationId.decorator';
import { AuthGuard } from '../../common/guards/auth.guard';
import { IApiResponse } from '../../common/interfaces/api-response.interface';
import { UserRole } from '../../common/interfaces/token-payload.interface';
import { CategoryService, CategoryWithStats } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category } from './entities/category.entity';

@ApiTags('Program Categories')
@Controller()
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  // --- ADMIN ENDPOINTS ---

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create program category (Admin)' })
  @ApiResponse({ status: 201, type: Category })
  @Post('categories')
  async create(
    @GetOrgId() orgId: string,
    @Body() dto: CreateCategoryDto,
  ): Promise<IApiResponse<Category>> {
    const data = await this.categoryService.create(orgId, dto);
    return { success: true, message: 'Category created successfully', data };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List categories with program counts, search & pagination (Admin)',
  })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @Get('categories/admin')
  async findAll(
    @GetOrgId() orgId: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ): Promise<IApiResponse<CategoryWithStats[]>> {
    const query = {
      search,
      page: Number(page) || 1,
      limit: Number(limit) || 50,
    };
    const result = await this.categoryService.findAll(orgId, query);
    return {
      success: true,
      message: 'Categories retrieved successfully',
      data: result.data,
      meta: { page: query.page, limit: query.limit, total: result.total },
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get category by id or slug (Admin)' })
  @Get('categories/admin/:id')
  async findOne(
    @GetOrgId() orgId: string,
    @Param('id') id: string,
  ): Promise<IApiResponse<Category>> {
    const data = await this.categoryService.findOne(orgId, id);
    return { success: true, message: 'Category retrieved successfully', data };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Update category; renames propagate to linked programs (Admin)',
  })
  @Patch('categories/:id')
  async update(
    @GetOrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
  ): Promise<IApiResponse<Category>> {
    const data = await this.categoryService.update(orgId, id, dto);
    return { success: true, message: 'Category updated successfully', data };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Delete category (only when no program uses it) (Admin)',
  })
  @Delete('categories/:id')
  async remove(
    @GetOrgId() orgId: string,
    @Param('id') id: string,
  ): Promise<IApiResponse<Category>> {
    const data = await this.categoryService.remove(orgId, id);
    return { success: true, message: 'Category deleted successfully', data };
  }

  // --- PUBLIC ENDPOINTS (WEBSITE) ---

  @ApiOperation({
    summary:
      'Active categories with published programs, program count and cover image (Website)',
  })
  @Get('public/categories')
  async findPublic(
    @GetOrgId({ required: false }) orgId?: string,
  ): Promise<IApiResponse<CategoryWithStats[]>> {
    const data = await this.categoryService.findPublic(orgId);
    return {
      success: true,
      message: 'Categories retrieved successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Get active category by slug (Website)' })
  @Get('public/categories/:slug')
  async findPublicBySlug(
    @Param('slug') slug: string,
    @GetOrgId({ required: false }) orgId?: string,
  ): Promise<IApiResponse<CategoryWithStats>> {
    const data = await this.categoryService.findPublicBySlug(slug, orgId);
    return { success: true, message: 'Category retrieved successfully', data };
  }
}

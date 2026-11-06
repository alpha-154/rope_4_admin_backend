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
import { Authorization } from '@/common/decorators/authorization.decorator';
import { GetOrgId } from '@/common/decorators/get-organizationId.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { IApiResponse } from '@/common/interfaces/api-response.interface';
import { UserRole } from '@/common/interfaces/token-payload.interface';
import {
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
} from './dto/product.dto';
import { Product } from './entities/product.entity';
import { ProductService } from './product.service';

@ApiTags('Products & Gear Store')
@Controller()
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  // ==========================================
  // ADMIN PRODUCT CRUD (DASHBOARD)
  // ==========================================

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List all products with filters & pagination (Admin)',
  })
  @Get('admin/products')
  async findAllAdmin(
    @GetOrgId() orgId: string,
    @Query() query: QueryProductDto,
  ): Promise<IApiResponse<any>> {
    const data = await this.productService.findAllAdmin(orgId, query);
    return {
      success: true,
      message: 'Products retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get single product by ID (Admin)' })
  @Get('admin/products/:id')
  async findByIdAdmin(
    @GetOrgId() orgId: string,
    @Param('id') id: string,
  ): Promise<IApiResponse<Product>> {
    const data = await this.productService.findByIdAdmin(orgId, id);
    return {
      success: true,
      message: 'Product retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create new gear product (Admin)' })
  @ApiResponse({ status: 201, type: Product })
  @Post('admin/products')
  async create(
    @GetOrgId() orgId: string,
    @Body() dto: CreateProductDto,
  ): Promise<IApiResponse<Product>> {
    const data = await this.productService.create(orgId, dto);
    return {
      success: true,
      message: 'Product created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update product details (Admin)' })
  @Patch('admin/products/:id')
  async update(
    @GetOrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<IApiResponse<Product>> {
    const data = await this.productService.update(orgId, id, dto);
    return {
      success: true,
      message: 'Product updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Soft delete product (Admin)' })
  @Delete('admin/products/:id')
  async remove(
    @GetOrgId() orgId: string,
    @Param('id') id: string,
  ): Promise<IApiResponse<{ id: string }>> {
    await this.productService.remove(orgId, id);
    return {
      success: true,
      message: 'Product deleted successfully',
      data: { id },
    };
  }

  // ==========================================
  // PUBLIC STOREFRONT ENDPOINTS (WEBSITE)
  // ==========================================

  @ApiOperation({ summary: 'Browse published gear store products (Public)' })
  @Get('public/products')
  async findAllPublic(
    @GetOrgId({ required: false }) orgId?: string,
    @Query('organizationId') queryOrgId?: string,
    @Query() query?: QueryProductDto,
  ): Promise<IApiResponse<any>> {
    const targetOrgId = orgId || queryOrgId;
    const data = await this.productService.findAllPublic(targetOrgId, query);
    return {
      success: true,
      message: 'Products retrieved successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Get published product by slug (Public)' })
  @Get('public/products/:slug')
  async findBySlugPublic(
    @Param('slug') slug: string,
    @GetOrgId({ required: false }) orgId?: string,
    @Query('organizationId') queryOrgId?: string,
  ): Promise<IApiResponse<Product>> {
    const targetOrgId = orgId || queryOrgId;
    const data = await this.productService.findBySlugPublic(slug, targetOrgId);
    return {
      success: true,
      message: 'Product details retrieved successfully',
      data,
    };
  }
}

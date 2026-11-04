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
import { CreateNewsDto } from './dto/create-news.dto';
import { QueryPublicNewsDto } from './dto/query-news.dto';
import { UpdateNewsDto } from './dto/update-news.dto';
import { News } from './entities/news.entity';
import { NewsService } from './news.service';

@ApiTags('News')
@Controller()
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  // --- ADMIN ENDPOINTS ---

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create news / story / article (Admin)' })
  @ApiResponse({ status: 201, type: News })
  @Post('news')
  async create(
    @GetOrgId() orgId: string,
    @Body() createDto: CreateNewsDto,
  ): Promise<IApiResponse<News>> {
    const data = await this.newsService.create(orgId, createDto);
    return {
      success: true,
      message: 'News article created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List all news articles (Admin)' })
  @ApiResponse({ status: 200, type: [News] })
  @Get('news/admin')
  async findAll(
    @GetOrgId() orgId: string,
    @QueryFeatureMultiple() query: IQueryFeatures,
  ): Promise<IApiResponse<News[]>> {
    const result = await this.newsService.findAll(orgId, query);
    return {
      success: true,
      message: 'News articles retrieved successfully',
      data: result.data as News[],
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
  @ApiOperation({ summary: 'Get single news article by ID (Admin)' })
  @ApiResponse({ status: 200, type: News })
  @Get('news/admin/:id')
  async findOne(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<News>> {
    const data = await this.newsService.findOne(id, orgId);
    return {
      success: true,
      message: 'News article retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update news article (Admin)' })
  @ApiResponse({ status: 200, type: News })
  @Patch('news/:id')
  async update(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
    @Body() updateDto: UpdateNewsDto,
  ): Promise<IApiResponse<News>> {
    const data = await this.newsService.update(id, orgId, updateDto);
    return {
      success: true,
      message: 'News article updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete news article (Admin)' })
  @ApiResponse({ status: 200 })
  @Delete('news/:id')
  async remove(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<News>> {
    const data = await this.newsService.remove(id, orgId);
    return {
      success: true,
      message: 'News article deleted successfully',
      data,
    };
  }

  // --- PUBLIC ENDPOINTS (WEBSITE) ---

  @ApiOperation({ summary: 'Get published news and articles (Website)' })
  @ApiResponse({ status: 200, type: [News] })
  @Get('public/news')
  async getPublicNews(
    @Query() queryDto: QueryPublicNewsDto,
  ): Promise<IApiResponse<News[]>> {
    const result = await this.newsService.findPublicNews(queryDto);
    return {
      success: true,
      message: 'News articles retrieved successfully',
      data: result.data as News[],
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    };
  }

  @ApiOperation({ summary: 'Get single published article by slug (Website)' })
  @ApiResponse({ status: 200, type: News })
  @Get('public/news/:slug')
  async getPublicNewsBySlug(
    @Param('slug') slug: string,
  ): Promise<IApiResponse<News>> {
    const data = await this.newsService.findPublicNewsBySlug(slug);
    return {
      success: true,
      message: 'News article retrieved successfully',
      data,
    };
  }
}

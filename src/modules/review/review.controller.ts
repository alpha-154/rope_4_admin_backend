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
import { CreateReviewDto } from './dto/create-review.dto';
import { QueryPublicReviewsDto } from './dto/query-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review } from './entities/review.entity';
import { ReviewService } from './review.service';

@ApiTags('Reviews')
@Controller()
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  // --- ADMIN ENDPOINTS ---

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Create new review (Admin)' })
  @ApiResponse({ status: 201, type: Review })
  @Post('reviews')
  async create(
    @GetOrgId() orgId: string,
    @Body() createDto: CreateReviewDto,
  ): Promise<IApiResponse<Review>> {
    const data = await this.reviewService.create(orgId, createDto);
    return {
      success: true,
      message: 'Review created successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'List all reviews with filters (Admin)' })
  @ApiResponse({ status: 200, type: [Review] })
  @Get('reviews/admin')
  async findAll(
    @GetOrgId() orgId: string,
    @QueryFeatureMultiple() query: IQueryFeatures,
  ): Promise<IApiResponse<Review[]>> {
    const result = await this.reviewService.findAll(orgId, query);
    return {
      success: true,
      message: 'Reviews retrieved successfully',
      data: result.data as Review[],
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
  @ApiOperation({ summary: 'Get single review by ID (Admin)' })
  @ApiResponse({ status: 200, type: Review })
  @Get('reviews/admin/:id')
  async findOne(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<Review>> {
    const data = await this.reviewService.findOne(id, orgId);
    return {
      success: true,
      message: 'Review retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update review details or approval status (Admin)' })
  @ApiResponse({ status: 200, type: Review })
  @Patch('reviews/:id')
  async update(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
    @Body() updateDto: UpdateReviewDto,
  ): Promise<IApiResponse<Review>> {
    const data = await this.reviewService.update(id, orgId, updateDto);
    return {
      success: true,
      message: 'Review updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Delete review (Admin)' })
  @ApiResponse({ status: 200 })
  @Delete('reviews/:id')
  async remove(
    @Param('id') id: string,
    @GetOrgId() orgId: string,
  ): Promise<IApiResponse<Review>> {
    const data = await this.reviewService.remove(id, orgId);
    return {
      success: true,
      message: 'Review deleted successfully',
      data,
    };
  }

  // --- PUBLIC ENDPOINTS (WEBSITE) ---

  @ApiOperation({ summary: 'Get approved reviews (Website)' })
  @ApiResponse({ status: 200, type: [Review] })
  @Get('public/reviews')
  async getPublicReviews(
    @Query() queryDto: QueryPublicReviewsDto,
  ): Promise<IApiResponse<Review[]>> {
    const result = await this.reviewService.findPublic(queryDto);
    return {
      success: true,
      message: 'Reviews retrieved successfully',
      data: result.data as Review[],
      meta: {
        page: result.page,
        limit: result.limit,
        total: result.total,
      },
    };
  }

  @ApiOperation({ summary: 'Get aggregate rating score and breakdown (Website)' })
  @ApiResponse({ status: 200 })
  @Get('public/reviews/aggregate')
  async getAggregateRating(
    @Query('organizationId') organizationId?: string,
  ): Promise<IApiResponse<any>> {
    const data = await this.reviewService.getAggregateRating(organizationId);
    return {
      success: true,
      message: 'Aggregate rating retrieved successfully',
      data,
    };
  }
}

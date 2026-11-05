import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetOrgId } from '../../common/decorators/get-organizationId.decorator';
import { IApiResponse } from '../../common/interfaces/api-response.interface';
import { PublicSearchDto } from './dto/public-search.dto';
import { SearchService } from './search.service';

@ApiTags('Search')
@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({
    summary:
      'Omni search supporting keyword search, taxonomy filter chips, and geospatial distance (Website)',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully',
  })
  @Get('public/search')
  async publicSearch(
    @Query() queryDto: PublicSearchDto,
    @GetOrgId({ required: false }) orgId?: string,
    @Query('organizationId') queryOrgId?: string,
  ): Promise<IApiResponse<any>> {
    const targetOrgId = orgId || queryOrgId;
    const data = await this.searchService.search(queryDto, targetOrgId);
    return {
      success: true,
      message: 'Search results retrieved successfully',
      data,
    };
  }

  @ApiOperation({
    summary:
      'Get available taxonomy filter chips (categories, countries, seasons, months) with item counts',
  })
  @ApiResponse({
    status: 200,
    description: 'Taxonomies retrieved successfully',
  })
  @Get('public/search/taxonomies')
  async getTaxonomies(
    @GetOrgId({ required: false }) orgId?: string,
    @Query('organizationId') queryOrgId?: string,
  ): Promise<IApiResponse<any>> {
    const targetOrgId = orgId || queryOrgId;
    const data = await this.searchService.getTaxonomies(targetOrgId);
    return {
      success: true,
      message: 'Taxonomies retrieved successfully',
      data,
    };
  }
}

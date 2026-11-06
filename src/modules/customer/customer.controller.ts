import {
  Body,
  Controller,
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
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { GetOrgId } from '@/common/decorators/get-organizationId.decorator';
import { AuthGuard } from '@/common/guards/auth.guard';
import { IApiResponse } from '@/common/interfaces/api-response.interface';
import {
  TokenPayload,
  UserRole,
} from '@/common/interfaces/token-payload.interface';
import { CustomerService } from './customer.service';
import { CustomerLoginDto, CustomerRegisterDto } from './dto/customer-auth.dto';
import {
  QueryCustomerDto,
  ToggleWishlistDto,
  UpdateCustomerProfileDto,
  UpdateCustomerStatusDto,
} from './dto/customer-management.dto';
import { Customer } from './entities/customer.entity';

@ApiTags('Customers & Traveler Auth')
@Controller()
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  // ==========================================
  // PUBLIC CUSTOMER ENDPOINTS (WEBSITE)
  // ==========================================

  @ApiOperation({ summary: 'Register a new traveler/customer account' })
  @ApiResponse({ status: 201, description: 'Account registered with JWT' })
  @Post('public/customer/register')
  async register(
    @Body() dto: CustomerRegisterDto,
    @GetOrgId({ required: false }) orgId?: string,
  ): Promise<IApiResponse<any>> {
    const data = await this.customerService.register(dto, orgId);
    return {
      success: true,
      message: 'Account created successfully',
      data,
    };
  }

  @ApiOperation({ summary: 'Login as customer / traveler' })
  @ApiResponse({ status: 200, description: 'Returns JWT and profile' })
  @Post('public/customer/login')
  async login(
    @Body() dto: CustomerLoginDto,
    @GetOrgId({ required: false }) orgId?: string,
  ): Promise<IApiResponse<any>> {
    const data = await this.customerService.login(dto, orgId);
    return {
      success: true,
      message: 'Login successful',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.CUSTOMER)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get current customer profile' })
  @Get('public/customer/me')
  async getProfile(
    @CurrentUser() user: TokenPayload,
  ): Promise<IApiResponse<Customer>> {
    const data = await this.customerService.getProfile(user.userId);
    return {
      success: true,
      message: 'Customer profile retrieved',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.CUSTOMER)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update customer personal profile & addresses' })
  @Patch('public/customer/profile')
  async updateProfile(
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateCustomerProfileDto,
  ): Promise<IApiResponse<Customer>> {
    const data = await this.customerService.updateProfile(user.userId, dto);
    return {
      success: true,
      message: 'Profile updated successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.CUSTOMER)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Toggle program or product in wishlist' })
  @Post('public/customer/wishlist/toggle')
  async toggleWishlist(
    @CurrentUser() user: TokenPayload,
    @Body() dto: ToggleWishlistDto,
  ): Promise<IApiResponse<any>> {
    const data = await this.customerService.toggleWishlist(user.userId, dto);
    return {
      success: true,
      message: data.isAdded
        ? 'Item added to wishlist'
        : 'Item removed from wishlist',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.CUSTOMER)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get customer wishlist item IDs' })
  @Get('public/customer/wishlist')
  async getWishlist(
    @CurrentUser() user: TokenPayload,
  ): Promise<IApiResponse<any>> {
    const data = await this.customerService.getWishlist(user.userId);
    return {
      success: true,
      message: 'Wishlist retrieved',
      data,
    };
  }

  // ==========================================
  // ADMIN CUSTOMER ENDPOINTS (DASHBOARD)
  // ==========================================

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List all registered customers with metrics (Admin)',
  })
  @Get('admin/customers')
  async getCustomers(
    @GetOrgId() orgId: string,
    @Query() query: QueryCustomerDto,
  ): Promise<IApiResponse<any>> {
    const data = await this.customerService.findAll(orgId, query);
    return {
      success: true,
      message: 'Customers retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get single customer details (Admin)' })
  @Get('admin/customers/:id')
  async getCustomerById(
    @GetOrgId() orgId: string,
    @Param('id') id: string,
  ): Promise<IApiResponse<Customer>> {
    const data = await this.customerService.findById(orgId, id);
    return {
      success: true,
      message: 'Customer retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Update customer status (Block/Activate) (Admin)' })
  @Patch('admin/customers/:id/status')
  async updateCustomerStatus(
    @GetOrgId() orgId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerStatusDto,
  ): Promise<IApiResponse<Customer>> {
    const data = await this.customerService.updateStatus(orgId, id, dto);
    return {
      success: true,
      message: 'Customer status updated successfully',
      data,
    };
  }
}

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
import {
  CreateOrderDto,
  QueryOrderDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './order.service';

@ApiTags('Orders & Transactional Checkout')
@Controller()
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  // ==========================================
  // PUBLIC STOREFRONT CHECKOUT
  // ==========================================

  @ApiOperation({
    summary:
      'Checkout and place order with atomic stock decrement (Guest or Customer)',
  })
  @ApiResponse({ status: 201, description: 'Order placed successfully' })
  @Post(['public/orders', 'public/checkout'])
  async checkout(
    @Body() dto: CreateOrderDto,
    @GetOrgId({ required: false }) orgId?: string,
    @CurrentUser() user?: TokenPayload,
  ): Promise<IApiResponse<Order>> {
    const customerId =
      user?.role === UserRole.CUSTOMER ? user.userId : undefined;
    const data = await this.orderService.createOrder(dto, orgId, customerId);
    return {
      success: true,
      message: 'Order placed successfully. Confirmation email sent.',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.CUSTOMER)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get logged in customer order history' })
  @Get('public/customer/orders')
  async getCustomerOrders(
    @CurrentUser() user: TokenPayload,
  ): Promise<IApiResponse<Order[]>> {
    const data = await this.orderService.findCustomerOrders(user.userId);
    return {
      success: true,
      message: 'Customer orders retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.CUSTOMER)
  @UseGuards(AuthGuard)
  @ApiOperation({ summary: 'Get single order detail for customer' })
  @Get('public/customer/orders/:id')
  async getCustomerOrderById(
    @CurrentUser() user: TokenPayload,
    @Param('id') id: string,
  ): Promise<IApiResponse<Order>> {
    const data = await this.orderService.findCustomerOrderById(user.userId, id);
    return {
      success: true,
      message: 'Order retrieved successfully',
      data,
    };
  }

  // ==========================================
  // ADMIN ORDER MANAGEMENT
  // ==========================================

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'List orders with pagination & status filters (Admin)',
  })
  @Get('admin/orders')
  async findAllAdmin(
    @GetOrgId() orgId: string,
    @Query() query: QueryOrderDto,
  ): Promise<IApiResponse<any>> {
    const data = await this.orderService.findAllAdmin(orgId, query);
    return {
      success: true,
      message: 'Orders retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.EDITOR)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary: 'Get order details with line items & history (Admin)',
  })
  @Get('admin/orders/:id')
  async findByIdAdmin(
    @GetOrgId() orgId: string,
    @Param('id') id: string,
  ): Promise<IApiResponse<Order>> {
    const data = await this.orderService.findByIdAdmin(orgId, id);
    return {
      success: true,
      message: 'Order retrieved successfully',
      data,
    };
  }

  @ApiBearerAuth()
  @Authorization(UserRole.SUPER_ADMIN, UserRole.ADMIN)
  @UseGuards(AuthGuard)
  @ApiOperation({
    summary:
      'Update order status workflow (pending -> confirmed -> shipped -> delivered, or cancelled with auto-restock) (Admin)',
  })
  @Patch('admin/orders/:id/status')
  async updateStatus(
    @GetOrgId() orgId: string,
    @Param('id') id: string,
    @CurrentUser() user: TokenPayload,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<IApiResponse<Order>> {
    const staffName =
      user.firstName && user.lastName
        ? `${user.firstName} ${user.lastName}`
        : user.email;

    const data = await this.orderService.updateOrderStatus(
      orgId,
      id,
      dto,
      staffName,
    );
    return {
      success: true,
      message: `Order status updated to ${dto.status}`,
      data,
    };
  }
}

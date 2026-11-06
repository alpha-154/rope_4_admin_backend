import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { escapeRegex } from '@/common/utils/escape-regex.util';
import {
  Customer,
  CustomerDocument,
} from '@/modules/customer/entities/customer.entity';
import { StockMovementType } from '@/modules/inventory/entities/stock-movement.entity';
import { InventoryService } from '@/modules/inventory/inventory.service';
import { BrevoMailerService } from '@/modules/mailer/brevo-mailer.service';
import { OrganizationService } from '@/modules/organization/organization.service';
import {
  Product,
  ProductDocument,
} from '@/modules/product/entities/product.entity';
import {
  CreateOrderDto,
  QueryOrderDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';
import {
  Order,
  OrderDocument,
  OrderItem,
  OrderStatus,
  PaymentStatus,
} from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    private readonly inventoryService: InventoryService,
    private readonly mailerService: BrevoMailerService,
    private readonly orgService: OrganizationService,
  ) {}

  private async resolveOrgId(
    providedOrgId?: string,
  ): Promise<mongoose.Types.ObjectId> {
    if (providedOrgId && mongoose.Types.ObjectId.isValid(providedOrgId)) {
      return new mongoose.Types.ObjectId(providedOrgId);
    }
    const defaultOrg = await this.orgService.findDefaultOrFirst();
    if (defaultOrg) {
      return defaultOrg._id as mongoose.Types.ObjectId;
    }
    return new mongoose.Types.ObjectId('659fa421943d22001e749210');
  }

  private generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(100000 + Math.random() * 900000);
    return `R4-ORD-${year}-${random}`;
  }

  // --- ATOMIC CHECKOUT & ORDER CREATION ---

  async createOrder(
    dto: CreateOrderDto,
    orgIdHeader?: string,
    customerId?: string,
  ): Promise<Order> {
    const orgObjId = await this.resolveOrgId(orgIdHeader);

    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Order must contain at least one item');
    }

    // Step 1: Pre-fetch all products & validate existence and stock
    const validatedProducts: Array<{
      inputItem: any;
      product: ProductDocument;
    }> = [];

    for (const item of dto.items) {
      if (!mongoose.Types.ObjectId.isValid(item.productId)) {
        throw new BadRequestException(`Invalid product ID: ${item.productId}`);
      }

      const product = await this.productModel
        .findOne({
          _id: item.productId,
          organizationId: orgObjId,
          isPublished: true,
          isDeleted: false,
        })
        .exec();

      if (!product) {
        throw new NotFoundException(
          `Product with ID ${item.productId} was not found or is unavailable`,
        );
      }

      if (product.stockQuantity < item.quantity) {
        throw new BadRequestException(
          `Product "${product.title}" is out of stock or does not have sufficient quantity available. (Requested: ${item.quantity}, Available: ${product.stockQuantity})`,
        );
      }

      validatedProducts.push({ inputItem: item, product });
    }

    // Step 2: Atomic Decrement Loop with Rollback
    const decrementedList: Array<{
      product: ProductDocument;
      quantity: number;
      before: number;
      after: number;
    }> = [];

    for (const { inputItem, product } of validatedProducts) {
      const quantityToDeduct = Number(inputItem.quantity);
      const beforeStock = product.stockQuantity;

      // Atomic decrement condition: stockQuantity must still be >= quantity
      const updatedProduct = await this.productModel
        .findOneAndUpdate(
          {
            _id: product._id,
            organizationId: orgObjId,
            isPublished: true,
            isDeleted: false,
            stockQuantity: { $gte: quantityToDeduct },
          },
          { $inc: { stockQuantity: -quantityToDeduct } },
          { new: true },
        )
        .exec();

      if (!updatedProduct) {
        // Concurrency collision: another customer ordered the remaining units
        // Roll back any items decremented so far in this order batch
        for (const done of decrementedList) {
          await this.productModel.updateOne(
            { _id: done.product._id },
            { $inc: { stockQuantity: done.quantity } },
          );
        }

        throw new BadRequestException(
          `Product "${product.title}" is out of stock or does not have sufficient quantity available.`,
        );
      }

      decrementedList.push({
        product: updatedProduct,
        quantity: quantityToDeduct,
        before: beforeStock,
        after: updatedProduct.stockQuantity,
      });
    }

    // Step 3: Build Order Items and Calculations
    const orderNumber = this.generateOrderNumber();
    let subtotal = 0;
    const orderItems: OrderItem[] = [];

    for (const { inputItem, product } of validatedProducts) {
      const itemSubtotal = product.price * inputItem.quantity;
      subtotal += itemSubtotal;

      orderItems.push({
        productId: product._id as mongoose.Types.ObjectId,
        productTitle: product.title,
        sku: product.sku,
        variant: inputItem.variant || null,
        quantity: inputItem.quantity,
        unitPrice: product.price,
        subtotal: itemSubtotal,
        image: product.images?.[0] || undefined,
      });
    }

    // Shipping fee calculation (Free shipping above 5000 BDT, else 120 BDT)
    const shippingFee = subtotal >= 5000 ? 0 : 120;
    const discountAmount = 0;
    const totalAmount = subtotal + shippingFee - discountAmount;

    // Step 4: Record Stock Movement Audit Logs
    for (const dec of decrementedList) {
      await this.inventoryService.recordOrderMovement({
        orgId: orgObjId,
        productId: dec.product._id as mongoose.Types.ObjectId,
        productTitle: dec.product.title,
        sku: dec.product.sku,
        type: StockMovementType.ORDER_REDUCTION,
        quantityChange: -dec.quantity,
        quantityBefore: dec.before,
        quantityAfter: dec.after,
        referenceId: orderNumber,
        reason: `Order checkout (${orderNumber})`,
        performedBy: dto.customerEmail,
      });
    }

    // Step 5: Persist Order Document
    let customerObjId: mongoose.Types.ObjectId | undefined = undefined;
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      customerObjId = new mongoose.Types.ObjectId(customerId);
    }

    const order = await this.orderModel.create({
      orderNumber,
      organizationId: orgObjId,
      customerId: customerObjId,
      customerEmail: dto.customerEmail.toLowerCase().trim(),
      customerName: dto.customerName.trim(),
      customerPhone: dto.customerPhone.trim(),
      shippingAddress: {
        street: dto.shippingAddress.street,
        city: dto.shippingAddress.city,
        state: dto.shippingAddress.state || '',
        postalCode: dto.shippingAddress.postalCode,
        country: dto.shippingAddress.country || 'Bangladesh',
      },
      items: orderItems,
      subtotal,
      shippingFee,
      discountAmount,
      totalAmount,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: dto.paymentMethod || 'COD',
      status: OrderStatus.PENDING,
      statusHistory: [
        {
          status: OrderStatus.PENDING,
          timestamp: new Date(),
          note: 'Order placed by customer via online store',
          changedBy: dto.customerName,
        },
      ],
      customerNotes: dto.customerNotes || '',
      adminNotes: '',
    });

    // Step 6: Update Customer metrics if customer was logged in
    if (customerObjId) {
      await this.customerModel.updateOne(
        { _id: customerObjId },
        {
          $inc: { totalOrders: 1, totalSpent: totalAmount },
        },
      );
    }

    // Step 7: Send Confirmation Email via Brevo
    try {
      await this.mailerService.sendOrderConfirmationEmail({
        recipientEmail: dto.customerEmail,
        recipientName: dto.customerName,
        orderNumber,
        totalAmount,
        itemsCount: orderItems.reduce((acc, it) => acc + it.quantity, 0),
      });
    } catch {
      // Non-blocking email dispatch failure
    }

    return order;
  }

  // --- ORDER STATUS WORKFLOW (ADMIN) ---

  async updateOrderStatus(
    orgId: string,
    orderId: string,
    dto: UpdateOrderStatusDto,
    staffPerformer: string = 'Staff Admin',
  ): Promise<Order> {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const order = await this.orderModel
      .findOne({ _id: orderId, organizationId: orgObjId })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const previousStatus = order.status;
    const targetStatus = dto.status;

    // Handle cancellation: Restock inventory atomically
    if (
      targetStatus === OrderStatus.CANCELLED &&
      previousStatus !== OrderStatus.CANCELLED
    ) {
      for (const item of order.items) {
        const productBefore = await this.productModel
          .findById(item.productId)
          .exec();
        const beforeQty = productBefore ? productBefore.stockQuantity : 0;

        const updated = await this.productModel
          .findOneAndUpdate(
            { _id: item.productId, organizationId: orgObjId },
            { $inc: { stockQuantity: item.quantity } },
            { new: true },
          )
          .exec();

        const afterQty = updated
          ? updated.stockQuantity
          : beforeQty + item.quantity;

        await this.inventoryService.recordOrderMovement({
          orgId: orgObjId,
          productId: item.productId,
          productTitle: item.productTitle,
          sku: item.sku,
          type: StockMovementType.RETURN_RESTOCK,
          quantityChange: item.quantity,
          quantityBefore: beforeQty,
          quantityAfter: afterQty,
          referenceId: order.orderNumber,
          reason: `Restocked due to order cancellation: ${dto.note || 'Cancelled'}`,
          performedBy: staffPerformer,
        });
      }
    }

    order.status = targetStatus;
    if (dto.paymentStatus) {
      order.paymentStatus = dto.paymentStatus;
    }
    if (dto.adminNotes !== undefined) {
      order.adminNotes = dto.adminNotes;
    }

    order.statusHistory.push({
      status: targetStatus,
      timestamp: new Date(),
      note: dto.note || `Status updated to ${targetStatus}`,
      changedBy: staffPerformer,
    });

    return order.save();
  }

  // --- ADMIN ORDER QUERIES ---

  async findAllAdmin(orgId: string, query: QueryOrderDto) {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { organizationId: orgObjId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.paymentStatus) {
      filter.paymentStatus = query.paymentStatus;
    }

    if (query.search?.trim()) {
      const sanitized = escapeRegex(query.search.trim());
      filter.$or = [
        { orderNumber: { $regex: sanitized, $options: 'i' } },
        { customerName: { $regex: sanitized, $options: 'i' } },
        { customerEmail: { $regex: sanitized, $options: 'i' } },
        { customerPhone: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.orderModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.orderModel.countDocuments(filter).exec(),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByIdAdmin(orgId: string, orderId: string): Promise<Order> {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const order = await this.orderModel
      .findOne({ _id: orderId, organizationId: orgObjId })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // --- CUSTOMER ORDER PORTAL ---

  async findCustomerOrders(customerId: string) {
    const customerObjId = new mongoose.Types.ObjectId(customerId);
    return this.orderModel
      .find({ customerId: customerObjId })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findCustomerOrderById(
    customerId: string,
    orderId: string,
  ): Promise<Order> {
    const customerObjId = new mongoose.Types.ObjectId(customerId);
    const order = await this.orderModel
      .findOne({ _id: orderId, customerId: customerObjId })
      .exec();

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}

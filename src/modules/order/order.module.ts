import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Customer,
  CustomerSchema,
} from '@/modules/customer/entities/customer.entity';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { MailerModule } from '@/modules/mailer/mailer.module';
import { OrganizationModule } from '@/modules/organization/organization.module';
import {
  Product,
  ProductSchema,
} from '@/modules/product/entities/product.entity';
import { Order, OrderSchema } from './entities/order.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Customer.name, schema: CustomerSchema },
    ]),
    InventoryModule,
    OrganizationModule,
    MailerModule,
  ],
  controllers: [OrderController],
  providers: [OrderService],
  exports: [OrderService, MongooseModule],
})
export class OrderModule {}


import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  FormSubmission,
  FormSubmissionSchema,
} from '../form/entities/form-submission.entity';
import { Order, OrderSchema } from '../order/entities/order.entity';
import {
  Organization,
  OrganizationSchema,
} from '../organization/entities/organization.entity';
import { Product, ProductSchema } from '../product/entities/product.entity';
import { Program, ProgramSchema } from '../program/entities/program.entity';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Program.name, schema: ProgramSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Order.name, schema: OrderSchema },
      { name: FormSubmission.name, schema: FormSubmissionSchema },
      { name: Organization.name, schema: OrganizationSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}

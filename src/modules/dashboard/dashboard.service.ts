import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { EnvironmentKey } from '@/config';
import {
  FormSubmission,
  SubmissionStatus,
} from '../form/entities/form-submission.entity';
import { Order, OrderStatus } from '../order/entities/order.entity';
import { Organization } from '../organization/entities/organization.entity';
import { Product } from '../product/entities/product.entity';
import { Program, ProgramStatus } from '../program/entities/program.entity';
import {
  DashboardStatsDto,
  PeriodComparisonDto,
} from './dto/dashboard-stats.dto';

const PERIOD_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

const DB_STATES: Record<number, string> = {
  0: 'disconnected',
  1: 'connected',
  2: 'connecting',
  3: 'disconnecting',
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(Program.name) private readonly programModel: Model<Program>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    @InjectModel(Order.name) private readonly orderModel: Model<Order>,
    @InjectModel(FormSubmission.name)
    private readonly submissionModel: Model<FormSubmission>,
    @InjectModel(Organization.name)
    private readonly organizationModel: Model<Organization>,
    @InjectConnection() private readonly connection: Connection,
    private readonly configService: ConfigService,
  ) {}

  async getStats(orgId: string): Promise<DashboardStatsDto> {
    const organizationId = new Types.ObjectId(orgId);
    const now = new Date();
    const currentStart = new Date(now.getTime() - PERIOD_DAYS * DAY_MS);
    const previousStart = new Date(now.getTime() - 2 * PERIOD_DAYS * DAY_MS);

    const compare = async (
      model: Model<any>,
      baseFilter: Record<string, unknown>,
    ): Promise<PeriodComparisonDto> => {
      const [current, previous] = await Promise.all([
        model.countDocuments({
          ...baseFilter,
          createdAt: { $gte: currentStart, $lte: now },
        }),
        model.countDocuments({
          ...baseFilter,
          createdAt: { $gte: previousStart, $lt: currentStart },
        }),
      ]);
      return {
        current,
        previous,
        changePercent:
          previous === 0
            ? null
            : Math.round(((current - previous) / previous) * 100),
      };
    };

    const productBase = { organizationId, isDeleted: { $ne: true } };

    const [
      activePrograms,
      totalPrograms,
      programsCreated,
      totalProducts,
      publishedProducts,
      lowStock,
      outOfStock,
      productsCreated,
      ordersPlaced,
      revenueAgg,
      pendingOrders,
      inquiriesReceived,
      unreadInquiries,
      organization,
    ] = await Promise.all([
      this.programModel.countDocuments({
        organizationId,
        status: ProgramStatus.PUBLISHED,
      }),
      this.programModel.countDocuments({ organizationId }),
      compare(this.programModel, { organizationId }),
      this.productModel.countDocuments(productBase),
      this.productModel.countDocuments({ ...productBase, isPublished: true }),
      this.productModel.countDocuments({
        ...productBase,
        stockQuantity: { $gt: 0 },
        $expr: { $lte: ['$stockQuantity', '$lowStockThreshold'] },
      }),
      this.productModel.countDocuments({ ...productBase, stockQuantity: 0 }),
      compare(this.productModel, productBase),
      compare(this.orderModel, { organizationId }),
      this.orderModel.aggregate<{ total: number }>([
        {
          $match: {
            organizationId,
            status: { $ne: OrderStatus.CANCELLED },
            createdAt: { $gte: currentStart, $lte: now },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]),
      this.orderModel.countDocuments({
        organizationId,
        status: OrderStatus.PENDING,
      }),
      compare(this.submissionModel, { organizationId }),
      this.submissionModel.countDocuments({
        organizationId,
        status: SubmissionStatus.NEW,
      }),
      this.organizationModel
        .findById(organizationId)
        .select('name slug')
        .lean<{ name?: string; slug?: string }>(),
    ]);

    return {
      periodDays: PERIOD_DAYS,
      programs: {
        active: activePrograms,
        total: totalPrograms,
        created: programsCreated,
      },
      products: {
        total: totalProducts,
        published: publishedProducts,
        lowStock,
        outOfStock,
        created: productsCreated,
      },
      orders: {
        placed: ordersPlaced,
        revenue: revenueAgg[0]?.total ?? 0,
        pending: pendingOrders,
      },
      inquiries: {
        received: inquiriesReceived,
        unread: unreadInquiries,
      },
      system: {
        database: DB_STATES[this.connection.readyState] || 'disconnected',
        uptimeSeconds: Math.round(process.uptime()),
        environment:
          this.configService.get<string>(EnvironmentKey.NODE_ENV) ||
          'development',
        organizationName: organization?.name || '',
        organizationSlug: organization?.slug || '',
        websiteUrl:
          this.configService.get<string>(EnvironmentKey.FRONTEND_WEBSITE_URL) ||
          '',
        generatedAt: now.toISOString(),
      },
    };
  }
}

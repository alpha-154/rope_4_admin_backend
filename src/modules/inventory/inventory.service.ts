import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { escapeRegex } from '@/common/utils/escape-regex.util';
import {
  Product,
  ProductDocument,
} from '@/modules/product/entities/product.entity';
import {
  AdjustInventoryDto,
  QueryInventoryDto,
  QueryStockMovementDto,
} from './dto/inventory.dto';
import {
  StockMovement,
  StockMovementDocument,
  StockMovementType,
} from './entities/stock-movement.entity';

@Injectable()
export class InventoryService {
  constructor(
    @InjectModel(StockMovement.name)
    private readonly movementModel: Model<StockMovementDocument>,
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
  ) {}

  // --- ATOMIC STOCK ADJUSTMENT ---

  async adjustStock(
    orgId: string,
    dto: AdjustInventoryDto,
    performedBy: string = 'Staff',
  ) {
    const orgObjId = new mongoose.Types.ObjectId(orgId);

    const product = await this.productModel
      .findOne({
        _id: dto.productId,
        organizationId: orgObjId,
        isDeleted: false,
      })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const quantityBefore = product.stockQuantity;
    const quantityChange = Number(dto.quantityChange);

    if (quantityBefore + quantityChange < 0) {
      throw new BadRequestException(
        `Insufficient stock: current stock is ${quantityBefore}, cannot deduct ${Math.abs(quantityChange)} units.`,
      );
    }

    // Atomic update
    const filter: Record<string, any> = {
      _id: product._id,
      organizationId: orgObjId,
    };
    if (quantityChange < 0) {
      filter.stockQuantity = { $gte: Math.abs(quantityChange) };
    }

    const updated = await this.productModel
      .findOneAndUpdate(
        filter,
        { $inc: { stockQuantity: quantityChange } },
        { new: true },
      )
      .exec();

    if (!updated) {
      throw new BadRequestException(
        'Stock adjustment failed due to concurrent modification. Please retry.',
      );
    }

    const quantityAfter = updated.stockQuantity;

    // Create audit movement log
    const movement = await this.movementModel.create({
      productId: product._id,
      productTitle: product.title,
      sku: product.sku,
      organizationId: orgObjId,
      type: dto.type,
      quantityChange,
      quantityBefore,
      quantityAfter,
      referenceId: dto.referenceId || null,
      reason:
        dto.reason ||
        `Manual adjustment (${quantityChange >= 0 ? '+' : ''}${quantityChange})`,
      performedBy,
    });

    return {
      product: updated,
      movement,
    };
  }

  // --- INTERNAL HELPER FOR ORDER SERVICE ---

  async recordOrderMovement(params: {
    orgId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    productTitle: string;
    sku: string;
    type: StockMovementType;
    quantityChange: number;
    quantityBefore: number;
    quantityAfter: number;
    referenceId: string;
    reason: string;
    performedBy: string;
  }): Promise<StockMovement> {
    return this.movementModel.create({
      productId: params.productId,
      productTitle: params.productTitle,
      sku: params.sku,
      organizationId: params.orgId,
      type: params.type,
      quantityChange: params.quantityChange,
      quantityBefore: params.quantityBefore,
      quantityAfter: params.quantityAfter,
      referenceId: params.referenceId,
      reason: params.reason,
      performedBy: params.performedBy,
    });
  }

  // --- INVENTORY OVERVIEW & SUMMARY ---

  async getInventoryOverview(orgId: string, query: QueryInventoryDto) {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 15));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId: orgObjId,
      isDeleted: false,
    };

    if (query.category) {
      filter.category = query.category;
    }

    if (query.status === 'inStock') {
      filter.stockQuantity = { $gt: 0 };
    } else if (query.status === 'outOfStock') {
      filter.stockQuantity = { $lte: 0 };
    } else if (query.status === 'lowStock') {
      filter.$expr = { $lte: ['$stockQuantity', '$lowStockThreshold'] };
    }

    if (query.search?.trim()) {
      const sanitized = escapeRegex(query.search.trim());
      filter.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { sku: { $regex: sanitized, $options: 'i' } },
        { category: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const [items, total, summaryMetrics] = await Promise.all([
      this.productModel
        .find(filter)
        .sort({ stockQuantity: 1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
      this.productModel.aggregate([
        { $match: { organizationId: orgObjId, isDeleted: false } },
        {
          $group: {
            _id: null,
            totalSkus: { $sum: 1 },
            totalUnits: { $sum: '$stockQuantity' },
            totalValuation: {
              $sum: { $multiply: ['$stockQuantity', '$price'] },
            },
            lowStockCount: {
              $sum: {
                $cond: [
                  { $lte: ['$stockQuantity', '$lowStockThreshold'] },
                  1,
                  0,
                ],
              },
            },
            outOfStockCount: {
              $sum: {
                $cond: [{ $lte: ['$stockQuantity', 0] }, 1, 0],
              },
            },
          },
        },
      ]),
    ]);

    const metrics = summaryMetrics[0] || {
      totalSkus: 0,
      totalUnits: 0,
      totalValuation: 0,
      lowStockCount: 0,
      outOfStockCount: 0,
    };

    return {
      items,
      metrics,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // --- AUDIT TRAIL LOGS ---

  async getStockMovements(orgId: string, query: QueryStockMovementDto) {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { organizationId: orgObjId };

    if (query.productId && mongoose.Types.ObjectId.isValid(query.productId)) {
      filter.productId = new mongoose.Types.ObjectId(query.productId);
    }

    if (query.type) {
      filter.type = query.type;
    }

    if (query.search?.trim()) {
      const sanitized = escapeRegex(query.search.trim());
      filter.$or = [
        { productTitle: { $regex: sanitized, $options: 'i' } },
        { sku: { $regex: sanitized, $options: 'i' } },
        { referenceId: { $regex: sanitized, $options: 'i' } },
        { reason: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.movementModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.movementModel.countDocuments(filter).exec(),
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
}

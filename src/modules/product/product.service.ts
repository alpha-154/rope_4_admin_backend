import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import slugify from 'slugify';
import { escapeRegex } from '@/common/utils/escape-regex.util';
import { OrganizationService } from '@/modules/organization/organization.service';
import {
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
} from './dto/product.dto';
import { Product, ProductDocument } from './entities/product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,
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

  private generateSlug(title: string): string {
    return slugify(title, {
      lower: true,
      strict: true,
      remove: /[*+~.()'"!:@]/g,
    });
  }

  // --- ADMIN METHODS ---

  async create(orgId: string, dto: CreateProductDto): Promise<Product> {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    let slug = dto.slug
      ? this.generateSlug(dto.slug)
      : this.generateSlug(dto.title);

    // Verify slug uniqueness in organization
    const slugExists = await this.productModel
      .findOne({ organizationId: orgObjId, slug })
      .exec();
    if (slugExists) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    // Verify SKU uniqueness
    const skuExists = await this.productModel
      .findOne({
        organizationId: orgObjId,
        sku: dto.sku.trim().toUpperCase(),
        isDeleted: false,
      })
      .exec();
    if (skuExists) {
      throw new ConflictException(`Product SKU "${dto.sku}" already exists`);
    }

    const product = new this.productModel({
      ...dto,
      slug,
      sku: dto.sku.trim().toUpperCase(),
      organizationId: orgObjId,
      isDeleted: false,
    });

    return product.save();
  }

  async findAllAdmin(
    orgId: string,
    query: QueryProductDto,
  ): Promise<{
    items: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId: orgObjId,
      isDeleted: false,
    };

    if (query.publishStatus === 'published') {
      filter.isPublished = true;
    } else if (query.publishStatus === 'draft') {
      filter.isPublished = false;
    }

    if (query.category) {
      filter.category = query.category;
    }

    if (query.stockStatus === 'inStock') {
      filter.stockQuantity = { $gt: 0 };
    } else if (query.stockStatus === 'outOfStock') {
      filter.stockQuantity = { $lte: 0 };
    } else if (query.stockStatus === 'lowStock') {
      filter.$expr = { $lte: ['$stockQuantity', '$lowStockThreshold'] };
    }

    if (query.search?.trim()) {
      const sanitized = escapeRegex(query.search.trim());
      filter.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { sku: { $regex: sanitized, $options: 'i' } },
        { brand: { $regex: sanitized, $options: 'i' } },
      ];
    }

    let sortOption: Record<string, any> = { createdAt: -1 };
    if (query.sort === 'price_asc') sortOption = { price: 1 };
    else if (query.sort === 'price_desc') sortOption = { price: -1 };
    else if (query.sort === 'title') sortOption = { title: 1 };

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    // If empty, auto-seed defaults for convenience
    if (total === 0 && !query.search && !query.category) {
      const seeded = await this.seedDefaultProducts(orgId);
      if (seeded.length > 0) {
        return this.findAllAdmin(orgId, query);
      }
    }

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

  async findByIdAdmin(orgId: string, id: string): Promise<Product> {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const product = await this.productModel
      .findOne({ _id: id, organizationId: orgObjId, isDeleted: false })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }
    return product;
  }

  async update(
    orgId: string,
    id: string,
    dto: UpdateProductDto,
  ): Promise<Product> {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const product = await this.productModel
      .findOne({ _id: id, organizationId: orgObjId, isDeleted: false })
      .exec();

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (dto.sku && dto.sku.trim().toUpperCase() !== product.sku) {
      const skuExists = await this.productModel
        .findOne({
          _id: { $ne: id },
          organizationId: orgObjId,
          sku: dto.sku.trim().toUpperCase(),
          isDeleted: false,
        })
        .exec();
      if (skuExists) {
        throw new ConflictException(`SKU "${dto.sku}" is already in use`);
      }
      product.sku = dto.sku.trim().toUpperCase();
    }

    if (dto.title && dto.title !== product.title && !dto.slug) {
      let slug = this.generateSlug(dto.title);
      const slugExists = await this.productModel
        .findOne({ _id: { $ne: id }, organizationId: orgObjId, slug })
        .exec();
      if (slugExists) slug = `${slug}-${Date.now().toString().slice(-4)}`;
      product.slug = slug;
    } else if (dto.slug) {
      product.slug = this.generateSlug(dto.slug);
    }

    Object.assign(product, dto);
    return product.save();
  }

  async remove(orgId: string, id: string): Promise<boolean> {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const result = await this.productModel
      .findOneAndUpdate(
        { _id: id, organizationId: orgObjId },
        { isDeleted: true },
        { new: true },
      )
      .exec();

    if (!result) {
      throw new NotFoundException('Product not found');
    }
    return true;
  }

  // --- PUBLIC STOREFRONT METHODS ---

  async findAllPublic(
    orgId?: string,
    query: QueryProductDto = {},
  ): Promise<{
    items: Product[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }> {
    const orgObjId = await this.resolveOrgId(orgId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 12));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = {
      organizationId: orgObjId,
      isPublished: true,
      isDeleted: false,
    };

    if (query.category) {
      filter.category = query.category;
    }

    if (query.brand) {
      filter.brand = query.brand;
    }

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filter.price = {};
      if (query.minPrice !== undefined)
        filter.price.$gte = Number(query.minPrice);
      if (query.maxPrice !== undefined)
        filter.price.$lte = Number(query.maxPrice);
    }

    if (query.stockStatus === 'inStock') {
      filter.stockQuantity = { $gt: 0 };
    }

    if (query.search?.trim()) {
      const sanitized = escapeRegex(query.search.trim());
      filter.$or = [
        { title: { $regex: sanitized, $options: 'i' } },
        { shortDescription: { $regex: sanitized, $options: 'i' } },
        { brand: { $regex: sanitized, $options: 'i' } },
        { tags: { $regex: sanitized, $options: 'i' } },
      ];
    }

    let sortOption: Record<string, any> = { createdAt: -1 };
    if (query.sort === 'price_asc') sortOption = { price: 1 };
    else if (query.sort === 'price_desc') sortOption = { price: -1 };
    else if (query.sort === 'rating') sortOption = { rating: -1 };
    else if (query.sort === 'title') sortOption = { title: 1 };

    const [items, total] = await Promise.all([
      this.productModel
        .find(filter)
        .sort(sortOption)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.productModel.countDocuments(filter).exec(),
    ]);

    // If store empty, auto seed
    if (total === 0 && !query.search && !query.category) {
      const seeded = await this.seedDefaultProducts(orgObjId.toString());
      if (seeded.length > 0) {
        return this.findAllPublic(orgObjId.toString(), query);
      }
    }

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

  async findBySlugPublic(slug: string, orgId?: string): Promise<Product> {
    const orgObjId = await this.resolveOrgId(orgId);
    const product = await this.productModel
      .findOne({
        slug,
        organizationId: orgObjId,
        isPublished: true,
        isDeleted: false,
      })
      .exec();

    if (!product) {
      throw new NotFoundException(`Product "${slug}" not found`);
    }

    return product;
  }

  // --- STARTER SEEDING ---

  async seedDefaultProducts(orgId: string): Promise<Product[]> {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const count = await this.productModel
      .countDocuments({ organizationId: orgObjId, isDeleted: false })
      .exec();
    if (count > 0) return [];

    const defaultItems = [
      {
        title: 'Rope4 Expedition Technical Backpack 55L',
        slug: 'rope4-expedition-technical-backpack-55l',
        sku: 'R4-BPK-55L',
        category: 'Camping & Backpacking',
        brand: 'Rope4',
        shortDescription:
          'Heavy-duty alpine mountaineering pack with ergonomic suspension and ice axe loops.',
        description:
          'Engineered for high altitude expeditions in harsh environments. Features 420D ripstop nylon, integrated waterproof rain fly, and hydration bladder compartment.',
        price: 6800,
        compareAtPrice: 7500,
        costPrice: 4200,
        stockQuantity: 30,
        lowStockThreshold: 5,
        images: [
          'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
        ],
        tags: ['backpack', 'alpine', 'hiking', 'expedition'],
        isPublished: true,
        isFeatured: true,
        rating: 4.9,
        reviewsCount: 14,
        organizationId: orgObjId,
        isDeleted: false,
      },
      {
        title: 'Rope4 Dynamic Alpine Climbing Rope 9.8mm x 60m',
        slug: 'rope4-dynamic-alpine-climbing-rope-98mm-60m',
        sku: 'R4-ROP-98-60M',
        category: 'Climbing Gear',
        brand: 'Rope4',
        shortDescription:
          'UIAA certified dry-treated dynamic single rope for rock and alpine climbing.',
        description:
          'Exceptional handling and durability. Thermoshield treatment ensures supple handling, while Pro Dry finish prevents water and dirt absorption in snow and ice conditions.',
        price: 9200,
        compareAtPrice: 10500,
        costPrice: 6500,
        stockQuantity: 18,
        lowStockThreshold: 4,
        images: [
          'https://images.unsplash.com/photo-1522163182402-834f871fd851?auto=format&fit=crop&w=800&q=80',
        ],
        tags: ['climbing', 'rope', 'uiaa', 'alpine'],
        isPublished: true,
        isFeatured: true,
        rating: 5.0,
        reviewsCount: 22,
        organizationId: orgObjId,
        isDeleted: false,
      },
      {
        title: 'Rope4 StormShield Gore-Tex Alpine Jacket',
        slug: 'rope4-stormshield-gore-tex-alpine-jacket',
        sku: 'R4-APP-JKT-01',
        category: 'Apparel',
        brand: 'Rope4',
        shortDescription:
          '3-layer weatherproof breathable shell engineered for extreme mountain conditions.',
        description:
          'Complete storm protection with helmet-compatible hood, pit zips for rapid ventilation, and reinforced shoulders for backpack harness wear.',
        price: 8400,
        compareAtPrice: 9900,
        costPrice: 5100,
        stockQuantity: 25,
        lowStockThreshold: 5,
        images: [
          'https://images.unsplash.com/photo-1544441893-675973e31985?auto=format&fit=crop&w=800&q=80',
        ],
        tags: ['jacket', 'apparel', 'waterproof', 'gore-tex'],
        isPublished: true,
        isFeatured: true,
        rating: 4.8,
        reviewsCount: 9,
        organizationId: orgObjId,
        isDeleted: false,
      },
      {
        title: 'Rope4 TrailMaster Carbon Trekking Poles (Pair)',
        slug: 'rope4-trailmaster-carbon-trekking-poles',
        sku: 'R4-POLE-CRB-01',
        category: 'Camping & Backpacking',
        brand: 'Rope4',
        shortDescription:
          'Ultralight 100% carbon fiber poles with quick-lock flick mechanism and cork grips.',
        description:
          'Reduces knee joint impact by up to 25% on steep descents. Includes interchangeable mud and snow baskets.',
        price: 3200,
        compareAtPrice: 3800,
        costPrice: 1900,
        stockQuantity: 40,
        lowStockThreshold: 8,
        images: [
          'https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=800&q=80',
        ],
        tags: ['poles', 'trekking', 'carbon', 'ultralight'],
        isPublished: true,
        isFeatured: false,
        rating: 4.9,
        reviewsCount: 16,
        organizationId: orgObjId,
        isDeleted: false,
      },
      {
        title: 'Rope4 Technical Screwgate Locking Carabiner (4-Pack)',
        slug: 'rope4-technical-screwgate-locking-carabiner-4pack',
        sku: 'R4-CRB-SCR-4PK',
        category: 'Climbing Gear',
        brand: 'Rope4',
        shortDescription:
          'Keylock nose preventing snagging, 25kN major axis strength.',
        description:
          'Hot-forged aluminum alloy construction. Perfectly balanced for belay stations, anchors, and glacier crevasse rescue kits.',
        price: 2400,
        compareAtPrice: 2800,
        costPrice: 1400,
        stockQuantity: 50,
        lowStockThreshold: 10,
        images: [
          'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?auto=format&fit=crop&w=800&q=80',
        ],
        tags: ['carabiner', 'hardware', 'climbing', 'safety'],
        isPublished: true,
        isFeatured: false,
        rating: 5.0,
        reviewsCount: 31,
        organizationId: orgObjId,
        isDeleted: false,
      },
    ];

    return this.productModel.create(defaultItems) as unknown as Promise<
      Product[]
    >;
  }
}

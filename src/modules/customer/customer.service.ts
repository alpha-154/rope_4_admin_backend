import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import mongoose, { Model } from 'mongoose';
import {
  TokenPayload,
  UserRole,
} from '@/common/interfaces/token-payload.interface';
import { escapeRegex } from '@/common/utils/escape-regex.util';
import { OrganizationService } from '@/modules/organization/organization.service';
import { CustomerLoginDto, CustomerRegisterDto } from './dto/customer-auth.dto';
import {
  QueryCustomerDto,
  ToggleWishlistDto,
  UpdateCustomerProfileDto,
  UpdateCustomerStatusDto,
} from './dto/customer-management.dto';
import { Customer, CustomerDocument } from './entities/customer.entity';

@Injectable()
export class CustomerService {
  constructor(
    @InjectModel(Customer.name)
    private readonly customerModel: Model<CustomerDocument>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

  private generateCustomerToken(customer: CustomerDocument): string {
    const payload: TokenPayload = {
      userId: customer._id.toString(),
      email: customer.email,
      role: UserRole.CUSTOMER,
      organizationId: customer.organizationId.toString(),
      firstName: customer.firstName,
      lastName: customer.lastName,
    };

    return this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      expiresIn: (this.configService.get<string>(
        'JWT_ACCESS_TOKEN_EXPIRATION',
      ) || '7d') as any,
    });
  }

  // --- PUBLIC CUSTOMER AUTH ---

  async register(dto: CustomerRegisterDto, orgIdHeader?: string) {
    const orgObjId = await this.resolveOrgId(dto.organizationId || orgIdHeader);
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existing = await this.customerModel
      .findOne({ organizationId: orgObjId, email: normalizedEmail })
      .exec();

    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(dto.password, salt);

    const customer = await this.customerModel.create({
      email: normalizedEmail,
      passwordHash,
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      phone: dto.phone?.trim() || '',
      organizationId: orgObjId,
      shippingAddresses: [],
      wishlist: [],
      totalOrders: 0,
      totalSpent: 0,
      isActive: true,
      isBlocked: false,
    });

    const token = this.generateCustomerToken(customer);

    return {
      token,
      customer: {
        id: customer._id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        avatar: customer.avatar,
        wishlist: customer.wishlist,
        shippingAddresses: customer.shippingAddresses,
      },
    };
  }

  async login(dto: CustomerLoginDto, orgIdHeader?: string) {
    const orgObjId = await this.resolveOrgId(dto.organizationId || orgIdHeader);
    const normalizedEmail = dto.email.toLowerCase().trim();

    const customer = await this.customerModel
      .findOne({ organizationId: orgObjId, email: normalizedEmail })
      .select('+passwordHash')
      .exec();

    if (!customer) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (customer.isBlocked) {
      throw new UnauthorizedException(
        'Your customer account has been suspended',
      );
    }

    const isMatch = await customer.comparePassword(dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.generateCustomerToken(customer);

    return {
      token,
      customer: {
        id: customer._id,
        email: customer.email,
        firstName: customer.firstName,
        lastName: customer.lastName,
        phone: customer.phone,
        avatar: customer.avatar,
        wishlist: customer.wishlist,
        shippingAddresses: customer.shippingAddresses,
        totalOrders: customer.totalOrders,
        totalSpent: customer.totalSpent,
      },
    };
  }

  async getProfile(customerId: string) {
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer profile not found');
    }
    return customer;
  }

  async updateProfile(customerId: string, dto: UpdateCustomerProfileDto) {
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (dto.firstName !== undefined) customer.firstName = dto.firstName.trim();
    if (dto.lastName !== undefined) customer.lastName = dto.lastName.trim();
    if (dto.phone !== undefined) customer.phone = dto.phone.trim();
    if (dto.avatar !== undefined) customer.avatar = dto.avatar;
    if (dto.shippingAddresses !== undefined) {
      customer.shippingAddresses = dto.shippingAddresses.map((addr) => ({
        id: addr.id || new mongoose.Types.ObjectId().toString(),
        label: addr.label || 'Address',
        street: addr.street,
        city: addr.city,
        state: addr.state || '',
        postalCode: addr.postalCode,
        country: addr.country || 'Bangladesh',
        isDefault: addr.isDefault || false,
      }));
    }

    return customer.save();
  }

  async toggleWishlist(customerId: string, dto: ToggleWishlistDto) {
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (!mongoose.Types.ObjectId.isValid(dto.itemId)) {
      throw new BadRequestException('Invalid item ID');
    }

    const itemObjId = new mongoose.Types.ObjectId(dto.itemId);
    const existingIndex = customer.wishlist.findIndex((id) =>
      id.equals(itemObjId),
    );

    let isAdded = false;
    if (existingIndex > -1) {
      customer.wishlist.splice(existingIndex, 1);
      isAdded = false;
    } else {
      customer.wishlist.push(itemObjId);
      isAdded = true;
    }

    await customer.save();

    return {
      success: true,
      isAdded,
      wishlist: customer.wishlist,
    };
  }

  async getWishlist(customerId: string) {
    const customer = await this.customerModel.findById(customerId).exec();
    if (!customer) {
      throw new NotFoundException('Customer not found');
    }
    return customer.wishlist;
  }

  // --- ADMIN CUSTOMER MANAGEMENT ---

  async findAll(orgId: string, query: QueryCustomerDto) {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 10));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { organizationId: orgObjId };

    if (query.status === 'active') {
      filter.isBlocked = false;
    } else if (query.status === 'blocked') {
      filter.isBlocked = true;
    }

    if (query.search?.trim()) {
      const sanitized = escapeRegex(query.search.trim());
      filter.$or = [
        { firstName: { $regex: sanitized, $options: 'i' } },
        { lastName: { $regex: sanitized, $options: 'i' } },
        { email: { $regex: sanitized, $options: 'i' } },
        { phone: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const [items, total] = await Promise.all([
      this.customerModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.customerModel.countDocuments(filter).exec(),
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

  async findById(orgId: string, customerId: string) {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const customer = await this.customerModel
      .findOne({ _id: customerId, organizationId: orgObjId })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async updateStatus(
    orgId: string,
    customerId: string,
    dto: UpdateCustomerStatusDto,
  ) {
    const orgObjId = new mongoose.Types.ObjectId(orgId);
    const customer = await this.customerModel
      .findOne({ _id: customerId, organizationId: orgObjId })
      .exec();

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    if (dto.isBlocked !== undefined) customer.isBlocked = dto.isBlocked;
    if (dto.isActive !== undefined) customer.isActive = dto.isActive;

    return customer.save();
  }
}

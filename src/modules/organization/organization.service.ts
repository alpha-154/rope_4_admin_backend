import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { createSlug } from '@/common/utils/slugify.util';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import {
  Organization,
  OrganizationDocument,
} from './entities/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    @InjectModel(Organization.name)
    private readonly orgModel: Model<OrganizationDocument>,
  ) {}

  async create(dto: CreateOrganizationDto): Promise<Organization> {
    const slug = dto.slug ? createSlug(dto.slug) : createSlug(dto.name);

    const existingName = await this.orgModel.findOne({
      $or: [{ name: dto.name }, { slug }],
    });

    if (existingName) {
      throw new ConflictException(
        'An organization with this name or slug already exists',
      );
    }

    const org = new this.orgModel({
      ...dto,
      slug,
      isActive: true,
      isDeleted: false,
    });

    return org.save();
  }

  async findById(id: string): Promise<Organization> {
    const org = await this.orgModel.findOne({ _id: id, isDeleted: false });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async findDefaultOrFirst(): Promise<Organization | null> {
    return this.orgModel
      .findOne({ isActive: true, isDeleted: false })
      .sort({ createdAt: 1 })
      .exec();
  }

  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.orgModel.findOne({ slug, isDeleted: false });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.findById(id);

    if (dto.name && dto.name !== org.name) {
      const existing = await this.orgModel.findOne({
        name: dto.name,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictException('Organization name already in use');
      }
    }

    if (dto.slug && dto.slug !== org.slug) {
      const formattedSlug = createSlug(dto.slug);
      const existing = await this.orgModel.findOne({
        slug: formattedSlug,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictException('Organization slug already in use');
      }
      dto.slug = formattedSlug;
    }

    Object.assign(org, dto);
    return org.save();
  }
}

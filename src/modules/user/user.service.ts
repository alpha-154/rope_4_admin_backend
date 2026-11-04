import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import mongoose, { Model } from 'mongoose';
import { UserRole } from '@/common/interfaces/token-payload.interface';
import { EnvironmentKey } from '@/config';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User, UserDocument } from './entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async create(
    orgId: string,
    dto: CreateUserDto,
    creatorRole?: UserRole,
  ): Promise<User> {
    if (
      dto.role === UserRole.SUPER_ADMIN &&
      creatorRole !== UserRole.SUPER_ADMIN
    ) {
      throw new ForbiddenException(
        'Only super admins can create super admin accounts',
      );
    }

    const existing = await this.userModel.findOne({
      email: dto.email.toLowerCase(),
    });
    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const saltRounds =
      this.configService.get<number>(EnvironmentKey.BCRYPT_SALT_ROUNDS) || 10;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = new this.userModel({
      email: dto.email.toLowerCase(),
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role,
      avatar: dto.avatar,
      organizationId: new mongoose.Types.ObjectId(orgId),
      isActive: true,
      isDeleted: false,
    });

    return user.save();
  }

  async findByEmail(
    email: string,
    includePassword = false,
  ): Promise<User | null> {
    const query = this.userModel.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });

    if (includePassword) {
      query.select('+passwordHash +refreshTokenHash');
    }

    return query.exec();
  }

  async findById(
    id: string,
    orgIdOrIncludePassword?: string | boolean,
    includePassword = false,
  ): Promise<User> {
    let orgId: string | undefined;
    let incPass = false;

    if (typeof orgIdOrIncludePassword === 'boolean') {
      incPass = orgIdOrIncludePassword;
    } else {
      orgId = orgIdOrIncludePassword;
      incPass = includePassword;
    }

    const filter: Record<string, any> = { _id: id, isDeleted: false };
    if (orgId) {
      filter.organizationId = new mongoose.Types.ObjectId(orgId);
    }
    const query = this.userModel.findOne(filter);
    if (incPass) {
      query.select('+passwordHash +refreshTokenHash');
    }
    const user = await query.exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findAllByOrg(orgId: string): Promise<User[]> {
    return this.userModel
      .find({
        organizationId: new mongoose.Types.ObjectId(orgId),
        isDeleted: false,
      })
      .sort({ createdAt: -1 })
      .exec();
  }

  async update(
    id: string,
    orgIdOrDto: string | UpdateUserDto,
    dtoOrEditorRole?: UpdateUserDto | UserRole,
    editorRole?: UserRole,
  ): Promise<User> {
    let orgId: string | undefined;
    let dto: UpdateUserDto;
    let role: UserRole | undefined;

    if (typeof orgIdOrDto === 'string') {
      orgId = orgIdOrDto;
      dto = dtoOrEditorRole as UpdateUserDto;
      role = editorRole;
    } else {
      dto = orgIdOrDto as UpdateUserDto;
      role = dtoOrEditorRole as UserRole;
    }

    const user = await this.findById(id, orgId, true);

    if (dto.role === UserRole.SUPER_ADMIN && role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException(
        'Only super admins can assign the super admin role',
      );
    }

    if (dto.email && dto.email.toLowerCase() !== user.email) {
      const existing = await this.userModel.findOne({
        email: dto.email.toLowerCase(),
        _id: { $ne: id },
      });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
      user.email = dto.email.toLowerCase();
    }

    if (dto.password) {
      const saltRounds =
        this.configService.get<number>(EnvironmentKey.BCRYPT_SALT_ROUNDS) || 10;
      user.passwordHash = await bcrypt.hash(dto.password, saltRounds);
    }

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.avatar !== undefined) user.avatar = dto.avatar;
    if (dto.role) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    return user.save();
  }

  async updateRefreshToken(
    id: string,
    refreshToken: string | null,
  ): Promise<void> {
    if (!refreshToken) {
      await this.userModel.findByIdAndUpdate(id, { refreshTokenHash: null });
      return;
    }

    const saltRounds =
      this.configService.get<number>(EnvironmentKey.BCRYPT_SALT_ROUNDS) || 10;
    // Pre-hash with SHA-256 to ensure input to bcrypt is strictly 64 characters (below bcrypt's 72-byte truncation limit)
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');
    const refreshTokenHash = await bcrypt.hash(tokenHash, saltRounds);

    await this.userModel.findByIdAndUpdate(id, { refreshTokenHash });
  }

  async softDelete(id: string, orgId: string): Promise<void> {
    const user = await this.findById(id, orgId);
    await this.userModel.updateOne(
      { _id: user._id, organizationId: new mongoose.Types.ObjectId(orgId) },
      { isDeleted: true, isActive: false },
    );
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcryptjs';
import mongoose, { Model } from 'mongoose';
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

  async create(orgId: string, dto: CreateUserDto): Promise<User> {
    const existing = await this.userModel.findOne({ email: dto.email.toLowerCase() });
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

  async findByEmail(email: string, includePassword = false): Promise<User | null> {
    const query = this.userModel.findOne({
      email: email.toLowerCase(),
      isDeleted: false,
    });

    if (includePassword) {
      query.select('+passwordHash +refreshTokenHash');
    }

    return query.exec();
  }

  async findById(id: string, includePassword = false): Promise<User> {
    const query = this.userModel.findOne({ _id: id, isDeleted: false });
    if (includePassword) {
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

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id, true);

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

  async updateRefreshToken(id: string, refreshToken: string | null): Promise<void> {
    if (!refreshToken) {
      await this.userModel.findByIdAndUpdate(id, { refreshTokenHash: null });
      return;
    }

    const saltRounds =
      this.configService.get<number>(EnvironmentKey.BCRYPT_SALT_ROUNDS) || 10;
    const refreshTokenHash = await bcrypt.hash(refreshToken, saltRounds);

    await this.userModel.findByIdAndUpdate(id, { refreshTokenHash });
  }

  async softDelete(id: string): Promise<void> {
    await this.userModel.findByIdAndUpdate(id, { isDeleted: true, isActive: false });
  }
}


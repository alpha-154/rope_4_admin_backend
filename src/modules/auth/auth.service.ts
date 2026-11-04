import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import {
  TokenPayload,
  UserRole,
} from '@/common/interfaces/token-payload.interface';
import { EnvironmentKey } from '@/config';
import { OrganizationService } from '../organization/organization.service';
import { UserService } from '../user/user.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterOrgDto } from './dto/register-org.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly orgService: OrganizationService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateToken(payload: TokenPayload, type: 'access' | 'refresh'): string {
    const isAccess = type === 'access';
    const secret = this.configService.get<string>(
      isAccess
        ? EnvironmentKey.JWT_ACCESS_TOKEN_SECRET
        : EnvironmentKey.JWT_REFRESH_TOKEN_SECRET,
    );
    const expiresIn = this.configService.get<number>(
      isAccess
        ? EnvironmentKey.JWT_ACCESS_TOKEN_EXPIRATION
        : EnvironmentKey.JWT_REFRESH_TOKEN_EXPIRATION,
    );

    const options: JwtSignOptions = {
      secret,
      expiresIn: Number(expiresIn),
    };

    return this.jwtService.sign(payload, options);
  }

  async registerOrg(dto: RegisterOrgDto) {
    const existingUser = await this.userService.findByEmail(dto.owner.email);
    if (existingUser) {
      throw new ConflictException('Owner email is already registered');
    }

    // 1. Create organization
    const org = await this.orgService.create({
      name: dto.organizationName,
      slug: dto.slug,
      contactEmail: dto.contactEmail,
      contactPhone: dto.contactPhone,
      address: dto.address,
    });

    // 2. Create owner user as SUPER_ADMIN
    const user = await this.userService.create(org._id.toString(), {
      email: dto.owner.email,
      password: dto.owner.password,
      firstName: dto.owner.firstName,
      lastName: dto.owner.lastName,
      role: UserRole.SUPER_ADMIN,
    });

    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: org._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = this.generateToken(tokenPayload, 'access');
    const refreshToken = this.generateToken(tokenPayload, 'refresh');

    await this.userService.updateRefreshToken(
      user._id.toString(),
      refreshToken,
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        contactEmail: org.contactEmail,
        logo: org.logo,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.userService.findByEmail(dto.email, true);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive || user.isDeleted) {
      throw new UnauthorizedException(
        'Account is inactive or has been suspended',
      );
    }

    const isMatch = await user.comparePassword(dto.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const org = await this.orgService.findById(user.organizationId.toString());
    if (!org.isActive || org.isDeleted) {
      throw new UnauthorizedException('Organization account is inactive');
    }

    const tokenPayload: TokenPayload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      organizationId: org._id.toString(),
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const accessToken = this.generateToken(tokenPayload, 'access');
    const refreshToken = this.generateToken(tokenPayload, 'refresh');

    await this.userService.updateRefreshToken(
      user._id.toString(),
      refreshToken,
    );

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
      },
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        logo: org.logo,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload: TokenPayload = await this.jwtService.verifyAsync(
        dto.refreshToken,
        {
          secret: this.configService.get<string>(
            EnvironmentKey.JWT_REFRESH_TOKEN_SECRET,
          ),
        },
      );

      const user = await this.userService.findById(payload.userId, true);
      if (!user || !user.isActive || user.isDeleted) {
        throw new UnauthorizedException('User account no longer active');
      }

      if (!user.refreshTokenHash) {
        throw new UnauthorizedException(
          'Session expired. Please log in again.',
        );
      }

      const hashedInput = crypto
        .createHash('sha256')
        .update(dto.refreshToken)
        .digest('hex');
      let isMatch = await bcrypt.compare(hashedInput, user.refreshTokenHash);
      if (!isMatch) {
        // Fallback for tokens issued prior to pre-hashing
        isMatch = await bcrypt.compare(dto.refreshToken, user.refreshTokenHash);
      }
      if (!isMatch) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload: TokenPayload = {
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
        organizationId: user.organizationId.toString(),
        firstName: user.firstName,
        lastName: user.lastName,
      };

      const accessToken = this.generateToken(newPayload, 'access');
      const newRefreshToken = this.generateToken(newPayload, 'refresh');

      await this.userService.updateRefreshToken(
        user._id.toString(),
        newRefreshToken,
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.userService.updateRefreshToken(userId, null);
    return { message: 'Logged out successfully' };
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.userService.findById(userId, true);
    const isMatch = await user.comparePassword(dto.oldPassword);
    if (!isMatch) {
      throw new BadRequestException('Current password is incorrect');
    }

    await this.userService.update(userId, { password: dto.newPassword });
    return { message: 'Password changed successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.userService.findById(userId);
    const org = await this.orgService.findById(user.organizationId.toString());

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar,
        createdAt: (user as any).createdAt,
      },
      organization: {
        id: org._id.toString(),
        name: org.name,
        slug: org.slug,
        contactEmail: org.contactEmail,
        contactPhone: org.contactPhone,
        address: org.address,
        logo: org.logo,
        settings: org.settings,
        socialLinks: org.socialLinks,
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updated = await this.userService.update(userId, dto);
    return {
      id: updated._id.toString(),
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      role: updated.role,
      avatar: updated.avatar,
    };
  }
}

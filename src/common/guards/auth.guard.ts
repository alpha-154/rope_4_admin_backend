import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ROLES_META_KEY } from '../decorators/authorization.decorator';
import { TokenPayload, UserRole } from '../interfaces/token-payload.interface';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Authentication token missing or invalid',
      );
    }

    const token = authHeader.split(' ')[1];

    try {
      const payload: TokenPayload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
      });

      request['user'] = payload;

      const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
        ROLES_META_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredRoles || requiredRoles.length === 0) {
        return true;
      }

      if (!requiredRoles.includes(payload.role)) {
        throw new ForbiddenException(
          'Insufficient permissions to access this resource',
        );
      }

      return true;
    } catch (err: any) {
      if (err instanceof ForbiddenException) throw err;
      throw new UnauthorizedException(
        'Invalid or expired authentication token',
      );
    }
  }
}

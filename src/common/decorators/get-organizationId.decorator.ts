import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { TokenPayload } from '../interfaces/token-payload.interface';

export const GetOrgId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as TokenPayload;

    if (user?.organizationId) {
      return user.organizationId;
    }

    const orgHeader =
      request.headers['x-organization-id'] || request.query['organizationId'];

    if (!orgHeader) {
      throw new BadRequestException(
        'Organization ID is required in headers (x-organization-id) or query',
      );
    }

    return orgHeader as string;
  },
);


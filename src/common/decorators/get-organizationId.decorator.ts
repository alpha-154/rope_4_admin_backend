import {
  BadRequestException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { TokenPayload } from '../interfaces/token-payload.interface';

export const GetOrgId = createParamDecorator(
  (
    options: { required?: boolean } | undefined,
    ctx: ExecutionContext,
  ): string | undefined => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as TokenPayload;

    if (user?.organizationId) {
      return user.organizationId;
    }

    const orgHeader =
      request.headers['x-organization-id'] || request.query['organizationId'];

    if (!orgHeader) {
      if (options?.required === false) {
        return undefined;
      }
      throw new BadRequestException(
        'Organization ID is required in headers (x-organization-id) or query',
      );
    }

    return orgHeader as string;
  },
);

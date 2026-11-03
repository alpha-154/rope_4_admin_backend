import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { TokenPayload } from '../interfaces/token-payload.interface';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): TokenPayload | null => {
    const request = ctx.switchToHttp().getRequest();
    return request.user || null;
  },
);


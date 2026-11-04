import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../interfaces/token-payload.interface';

export const ROLES_META_KEY = 'roles';
export const Authorization = (...roles: UserRole[]) =>
  SetMetadata(ROLES_META_KEY, roles);

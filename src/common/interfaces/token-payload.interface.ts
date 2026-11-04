export enum UserRole {
  SUPER_ADMIN = 'superAdmin',
  ADMIN = 'admin',
  EDITOR = 'editor',
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  organizationId: string;
  firstName?: string;
  lastName?: string;
}

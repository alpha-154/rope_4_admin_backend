export enum EnvironmentKey {
  NODE_ENV = 'NODE_ENV',
  PORT = 'PORT',
  MONGODB_URI = 'MONGODB_URI',
  BCRYPT_SALT_ROUNDS = 'BCRYPT_SALT_ROUNDS',
  JWT_ACCESS_TOKEN_SECRET = 'JWT_ACCESS_TOKEN_SECRET',
  JWT_ACCESS_TOKEN_EXPIRATION = 'JWT_ACCESS_TOKEN_EXPIRATION',
  JWT_REFRESH_TOKEN_SECRET = 'JWT_REFRESH_TOKEN_SECRET',
  JWT_REFRESH_TOKEN_EXPIRATION = 'JWT_REFRESH_TOKEN_EXPIRATION',
  FRONTEND_ADMIN_URL = 'FRONTEND_ADMIN_URL',
  FRONTEND_WEBSITE_URL = 'FRONTEND_WEBSITE_URL',
  UPLOAD_DIR = 'UPLOAD_DIR',
  BREVO_API_KEY = 'BREVO_API_KEY',
  BREVO_SENDER_EMAIL = 'BREVO_SENDER_EMAIL',
  BREVO_SENDER_NAME = 'BREVO_SENDER_NAME',
}

export const configuration = () => ({
  [EnvironmentKey.NODE_ENV]: process.env.NODE_ENV || 'development',
  [EnvironmentKey.PORT]: parseInt(process.env.PORT || '5001', 10),
  [EnvironmentKey.MONGODB_URI]:
    process.env.MONGODB_URI || 'mongodb://localhost:27017/rope4',
  [EnvironmentKey.BCRYPT_SALT_ROUNDS]: parseInt(
    process.env.BCRYPT_SALT_ROUNDS || '10',
    10,
  ),
  [EnvironmentKey.JWT_ACCESS_TOKEN_SECRET]:
    process.env.JWT_ACCESS_TOKEN_SECRET || 'rope4_jwt_access_secret_key',
  [EnvironmentKey.JWT_ACCESS_TOKEN_EXPIRATION]: parseInt(
    process.env.JWT_ACCESS_TOKEN_EXPIRATION || '3600',
    10,
  ),
  [EnvironmentKey.JWT_REFRESH_TOKEN_SECRET]:
    process.env.JWT_REFRESH_TOKEN_SECRET || 'rope4_jwt_refresh_secret_key',
  [EnvironmentKey.JWT_REFRESH_TOKEN_EXPIRATION]: parseInt(
    process.env.JWT_REFRESH_TOKEN_EXPIRATION || '604800',
    10,
  ),
  [EnvironmentKey.FRONTEND_ADMIN_URL]:
    process.env.FRONTEND_ADMIN_URL || 'http://localhost:3001',
  [EnvironmentKey.FRONTEND_WEBSITE_URL]:
    process.env.FRONTEND_WEBSITE_URL || 'http://localhost:3000',
  [EnvironmentKey.UPLOAD_DIR]: process.env.UPLOAD_DIR || './uploads',
  [EnvironmentKey.BREVO_API_KEY]: process.env.BREVO_API_KEY || '',
  [EnvironmentKey.BREVO_SENDER_EMAIL]:
    process.env.BREVO_SENDER_EMAIL || 'support@rope4.org',
  [EnvironmentKey.BREVO_SENDER_NAME]:
    process.env.BREVO_SENDER_NAME || 'Rope4 Adventure',
});

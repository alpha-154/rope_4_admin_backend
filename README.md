# Rope4 Admin Panel Backend

API backend service powering both the **Rope4 Admin Panel** and the **Rope4 Customer Website**.

## Tech Stack
- **Framework**: NestJS 10 (TypeScript Strict)
- **Database**: MongoDB with Mongoose
- **Validation**: `class-validator`, `class-transformer`
- **Security**: Helmet, HPP, Cookie Parser, CORS, Throttler
- **Documentation**: Swagger OpenAPI at `/api/docs`
- **Architecture**: Dashforge modular blueprint (`common/` decorators, guards, filters, interceptors)

## Getting Started

### 1. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Default variables:
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rope4
BCRYPT_SALT_ROUNDS=10

JWT_ACCESS_TOKEN_SECRET=rope4_jwt_access_secret_key_change_in_production
JWT_ACCESS_TOKEN_EXPIRATION=3600
JWT_REFRESH_TOKEN_SECRET=rope4_jwt_refresh_secret_key_change_in_production
JWT_REFRESH_TOKEN_EXPIRATION=604800

FRONTEND_ADMIN_URL=http://localhost:3001
FRONTEND_WEBSITE_URL=http://localhost:3000
UPLOAD_DIR=./uploads
```

### 2. Run Commands
```bash
# Install dependencies
npm install

# Build application
npm run build

# Start dev server (with hot reload)
npm run start:dev

# Start production server
npm run start:prod
```

### 3. Key Endpoints
- **Health Check**: `http://localhost:5001/api/health`
- **Swagger Documentation**: `http://localhost:5001/api/docs`


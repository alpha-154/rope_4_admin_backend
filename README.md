# Rope4 Admin Panel Backend

Enterprise NestJS 10 REST API powering the Rope4 Outdoor Education ecosystem: Admin Dashboard, Public Adventure Storefront, Multi-Tenant Organization Management, and Transactional E-commerce.

---

## 🛠️ Technology Stack
* **Framework**: NestJS 10 (TypeScript Strict Mode)
* **Database**: MongoDB 7+ with Mongoose 8 (`2dsphere` spatial indexes, compound text indexes)
* **Authentication**: Passport JWT with access/refresh token rotation, role guards, and bcrypt hashing
* **Email Service**: Brevo (Sendinblue) transactional mailer with fallback logging
* **Rate Limiting**: `@nestjs/throttler` (100 req/minute per IP)
* **Security & Sanitation**: Helmet, HPP, Cookie Parser, strict CORS, class-validator
* **Documentation**: Swagger OpenAPI at `/api/docs`

---

## 🚀 Setup & Execution

### 1. Environment Setup
```bash
cp .env.example .env
```

Ensure `MONGODB_URI` points to your MongoDB instance (local or Atlas Cloud).

### 2. Seed Database
Execute the idempotent seeding script to initialize the platform:
```bash
npm run seed
```
*Seeds: Organization, SuperAdmin, Editor, Customer, 6 Programs, 6 Products, Reviews, FAQs, News, and Form Definitions.*

### 3. Run Development Server
```bash
npm run start:dev
```
API runs on `http://localhost:5001/api/v1`.
Interactive Swagger UI: `http://localhost:5001/api/docs`.
Health Check: `http://localhost:5001/api/health`.

### 4. Build for Production
```bash
npm run lint
npm run build
npm run start:prod
```

---

## 📚 Key API Modules

### Public Endpoints (`/api/v1/public/*`)
* `GET /public/programs`: Catalog listing with filters (category, difficulty, season, country, text search)
* `GET /public/programs/:slug`: Full program details with day-by-day itineraries and departure dates
* `GET /public/products`: Store catalog with category filters and stock availability
* `GET /public/products/:slug`: Single product details, variants, specifications, and images
* `POST /public/checkout`: Transactional checkout with atomic inventory decrement (`$inc`)
* `POST /public/customer/register`: Customer account creation
* `POST /public/customer/login`: Customer authentication
* `GET /public/customer/me`: Customer profile, addresses, and wishlist
* `GET /public/customer/orders`: Order history for authenticated customer
* `GET /public/settings/navigation`: CMS header navigation and footer settings
* `POST /public/forms/:slug/submit`: Contact and expedition inquiry submissions
* `GET /public/reviews`: Approved customer testimonials and video reviews
* `GET /public/faqs`: Categorized questions and answers

### Admin Endpoints (`/api/v1/admin/*` — Protected by JWT & Roles)
* `POST /auth/login`: Admin credentials authentication
* `GET /admin/programs`: Programs CRUD with multi-tab itinerary & departure editor
* `GET /admin/products`: Product catalog CRUD
* `GET /admin/inventory`: Stock movement audit logs and quantity adjustments
* `GET /admin/orders`: Orders management (PENDING → CONFIRMED → SHIPPED → DELIVERED)
* `GET /admin/customers`: Registered customer directory with spend metrics
* `GET /admin/settings`: Header builder and footer settings
* `GET /admin/forms`: Form definitions and submissions inbox

# rope-4-admin-panel-backend

NestJS 10 + Mongoose 8 (MongoDB) API for the rope-4 CMS, store and customer portal.
Serves the admin panel (port 3001) and the website (port 3000). Workspace rules: `../CLAUDE.md`.

## Commands
- Dev: `npm run start:dev` (port 5001; Swagger http://localhost:5001/api/docs, health `/api/health`)
- Type-check: `npx tsc --noEmit -p tsconfig.json`
- Lint: `npm run lint` (runs eslint --fix) · Format: `npm run format`
- Build: `npm run build`
- Seed: `npm run seed` (idempotent upserts into the DB in MONGODB_URI; ask before running)
- No test suite: verify with tsc, lint and curl/Swagger against the dev server.

## Layout
- `src/main.ts`: global prefix `api/v1`, ValidationPipe (`whitelist` + `forbidNonWhitelisted` +
  `transform`), `HttpExceptionFilter`, `ResponseTransformInterceptor`, Helmet/HPP/CORS, Swagger,
  static `/uploads`.
- `src/app.module.ts`: registers every feature module; global JwtModule and ThrottlerGuard (100/min).
- `src/config/index.ts`: `EnvironmentKey` enum + defaults. Read env only via
  `ConfigService.get(EnvironmentKey.X)`; add new keys there and to `.env.example`.
- `src/common/`: `decorators/` (`@GetOrgId`, `@Authorization`, `@CurrentUser`,
  `@QueryFeatureMultiple/Single`), `guards/` (`AuthGuard`, `OptionalAuthGuard`),
  `helpers/mongodb-query-builder.helper.ts` (pagination/search/sort/filter), `utils/`
  (slugify, sanitize-html, escape-regex, fractional-indexing).
- `src/modules/<name>/`: `entities/`, `dto/`, `<name>.service.ts`, `<name>.controller.ts`,
  `<name>.module.ts`. Domains: auth, user, organization, customer, program, product, inventory,
  order, news, faq, highlight, review, popover, form, site-settings, search, storage, mailer, health.
- `src/seed.ts`: demo org, staff, customer, programs, products, CMS content.

## Conventions
- Multi-tenant: every entity has `organizationId` (ObjectId, indexed) and every query filters by
  `new Types.ObjectId(orgId)` from `@GetOrgId()`. Unique indexes are compound with organizationId.
- Roles (`UserRole`): superAdmin, admin, editor, customer. Admin routes:
  `@ApiBearerAuth() @Authorization(...) @UseGuards(AuthGuard)`; deletes are SUPER_ADMIN/ADMIN only.
- Controllers return `{ success, message, data, meta? }`; lists add `meta: { page, limit, total }`.
- Validation lives in DTOs (class-validator + `@ApiProperty`); update DTOs extend `PartialType`.
  Every new field needs a validator, or ValidationPipe rejects it.
- Lookups by id-or-slug: `Types.ObjectId.isValid(id) ? { _id } : { slug }`.
- Stock changes are atomic conditional `$inc` updates (order + inventory services) with manual
  rollback; keep that pattern, and log a stock movement for every inventory change.
- Rich HTML from the admin (news, programs, forms) goes through `sanitize-html.util.ts`.
- Regex search input goes through `escape-regex.util.ts`.
- Style: Prettier with single quotes and trailing commas (`.prettierrc`).

## Known quirks (don't build on them; ask before cleaning up)
- Two fractional-indexing utils: `src/common/utils/` (use this one) and `src/utils/` (FAQ only).
- Some services have their own `slugify()` method; new code uses `common/utils/slugify.util.ts`.

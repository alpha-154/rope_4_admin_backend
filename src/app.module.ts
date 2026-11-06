import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { configuration } from './config';
import { AuthModule } from './modules/auth/auth.module';
import { CustomerModule } from './modules/customer/customer.module';
import { DatabaseModule } from './modules/database/database.module';
import { FaqModule } from './modules/faq/faq.module';
import { FormModule } from './modules/form/form.module';
import { HealthModule } from './modules/health/health.module';
import { HighlightModule } from './modules/highlight/highlight.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { MailerModule } from './modules/mailer/mailer.module';
import { NewsModule } from './modules/news/news.module';
import { OrderModule } from './modules/order/order.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { PopoverModule } from './modules/popover/popover.module';
import { ProductModule } from './modules/product/product.module';
import { ProgramModule } from './modules/program/program.module';
import { ReviewModule } from './modules/review/review.module';
import { SearchModule } from './modules/search/search.module';
import { SiteSettingsModule } from './modules/site-settings/site-settings.module';
import { StorageModule } from './modules/storage/storage.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    DatabaseModule,
    HealthModule,
    OrganizationModule,
    UserModule,
    AuthModule,
    StorageModule,
    MailerModule,
    HighlightModule,
    FaqModule,
    ProgramModule,
    ReviewModule,
    NewsModule,
    PopoverModule,
    SiteSettingsModule,
    SearchModule,
    FormModule,
    CustomerModule,
    ProductModule,
    InventoryModule,
    OrderModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

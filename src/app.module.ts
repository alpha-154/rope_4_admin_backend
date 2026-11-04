import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { configuration } from './config';
import { AuthModule } from './modules/auth/auth.module';
import { DatabaseModule } from './modules/database/database.module';
import { FaqModule } from './modules/faq/faq.module';
import { HealthModule } from './modules/health/health.module';
import { HighlightModule } from './modules/highlight/highlight.module';
import { NewsModule } from './modules/news/news.module';
import { OrganizationModule } from './modules/organization/organization.module';
import { PopoverModule } from './modules/popover/popover.module';
import { ProgramModule } from './modules/program/program.module';
import { ReviewModule } from './modules/review/review.module';
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
    HighlightModule,
    FaqModule,
    ProgramModule,
    ReviewModule,
    NewsModule,
    PopoverModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}

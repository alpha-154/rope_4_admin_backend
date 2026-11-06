import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { CustomerController } from './customer.controller';
import { CustomerService } from './customer.service';
import { Customer, CustomerSchema } from './entities/customer.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: (configService.get<string>(
            'JWT_ACCESS_TOKEN_EXPIRATION',
          ) || '7d') as any,
        },
      }),
      inject: [ConfigService],
    }),
    OrganizationModule,
  ],
  controllers: [CustomerController],
  providers: [CustomerService],
  exports: [CustomerService, MongooseModule],
})
export class CustomerModule {}

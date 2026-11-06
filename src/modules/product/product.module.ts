import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrganizationModule } from '@/modules/organization/organization.module';
import { Product, ProductSchema } from './entities/product.entity';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Product.name, schema: ProductSchema }]),
    OrganizationModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService, MongooseModule],
})
export class ProductModule {}

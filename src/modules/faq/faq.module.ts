import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { FaqCategory, FaqCategorySchema } from './entities/faq-category.entity';
import { Faq, FaqSchema } from './entities/faq.entity';
import { FaqCategoryService } from './faq-category.service';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Faq.name, schema: FaqSchema },
      { name: FaqCategory.name, schema: FaqCategorySchema },
    ]),
    JwtModule,
  ],
  controllers: [FaqController],
  providers: [FaqService, FaqCategoryService],
  exports: [FaqService],
})
export class FaqModule {}

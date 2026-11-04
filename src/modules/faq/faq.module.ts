import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Faq, FaqSchema } from './entities/faq.entity';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Faq.name, schema: FaqSchema }]),
    JwtModule,
  ],
  controllers: [FaqController],
  providers: [FaqService],
  exports: [FaqService],
})
export class FaqModule {}


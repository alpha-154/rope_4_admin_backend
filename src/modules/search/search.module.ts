import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Faq, FaqSchema } from '../faq/entities/faq.entity';
import { News, NewsSchema } from '../news/entities/news.entity';
import { Program, ProgramSchema } from '../program/entities/program.entity';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Program.name, schema: ProgramSchema },
      { name: News.name, schema: NewsSchema },
      { name: Faq.name, schema: FaqSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}

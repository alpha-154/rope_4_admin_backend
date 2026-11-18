import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Program, ProgramSchema } from '../program/entities/program.entity';
import { CategoryController } from './category.controller';
import { CategoryService } from './category.service';
import { Category, CategorySchema } from './entities/category.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Category.name, schema: CategorySchema },
      { name: Program.name, schema: ProgramSchema },
    ]),
  ],
  controllers: [CategoryController],
  providers: [CategoryService],
  exports: [CategoryService],
})
export class CategoryModule {}

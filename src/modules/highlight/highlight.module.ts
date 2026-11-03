import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Highlight, HighlightSchema } from './entities/highlight.entity';
import { HighlightController } from './highlight.controller';
import { HighlightService } from './highlight.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Highlight.name, schema: HighlightSchema },
    ]),
    JwtModule,
  ],
  controllers: [HighlightController],
  providers: [HighlightService],
  exports: [HighlightService],
})
export class HighlightModule {}

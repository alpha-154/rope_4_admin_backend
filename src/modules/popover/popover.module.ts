import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { Popover, PopoverSchema } from './entities/popover.entity';
import { PopoverController } from './popover.controller';
import { PopoverService } from './popover.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Popover.name, schema: PopoverSchema }]),
    JwtModule,
  ],
  controllers: [PopoverController],
  providers: [PopoverService],
  exports: [PopoverService],
})
export class PopoverModule {}

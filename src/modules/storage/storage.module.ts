import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LocalStorageService } from './local-storage.service';
import { StorageController } from './storage.controller';

@Module({
  imports: [JwtModule],
  controllers: [StorageController],
  providers: [LocalStorageService],
  exports: [LocalStorageService],
})
export class StorageModule {}

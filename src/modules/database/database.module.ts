import { Global, Module, OnApplicationShutdown, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { getConnectionToken } from '@nestjs/mongoose';
import mongoose, { Connection } from 'mongoose';
import { EnvironmentKey } from '@/config';

const logger = new Logger('Database');

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: getConnectionToken(),
      inject: [ConfigService],
      useFactory: async (configService: ConfigService): Promise<Connection> => {
        const uri =
          configService.get<string>(EnvironmentKey.MONGODB_URI) ||
          'mongodb://localhost:27017/rope4';

        const connection = mongoose.createConnection(uri, {
          serverSelectionTimeoutMS: 10000,
          autoIndex: true,
        });

        connection.on('connected', () => {
          logger.log(`MongoDB connected successfully to Atlas cluster`);
        });

        connection.on('disconnected', () => {
          logger.warn('MongoDB connection lost / disconnected');
        });

        connection.on('error', (err) => {
          logger.error(`MongoDB connection error: ${err.message}`);
        });

        return connection;
      },
    },
  ],
  exports: [getConnectionToken()],
})
export class DatabaseModule implements OnApplicationShutdown {
  async onApplicationShutdown() {
    await mongoose.disconnect();
    logger.log('Closed all MongoDB connections');
  }
}

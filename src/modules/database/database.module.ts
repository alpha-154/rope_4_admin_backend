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
          family: 4,
        });

        connection.on('connected', () => {
          logger.log(`MongoDB connected successfully to Atlas cluster`);
        });

        connection.on('disconnected', () => {
          logger.warn('MongoDB connection lost / disconnected');
        });

        connection.on('error', (err: any) => {
          const errMsg = err?.message || String(err);
          logger.error(`MongoDB connection error: ${errMsg}`);

          if (
            errMsg.includes('alert number 80') ||
            errMsg.includes('tlsv1 alert internal error') ||
            errMsg.includes('ECONNREFUSED')
          ) {
            logger.warn(
              '⚠️  Atlas TLS/Connection Rejection: Your current IP address is not whitelisted on MongoDB Atlas. Please go to MongoDB Atlas -> Security -> Network Access -> Add IP Address (or allow 0.0.0.0/0).',
            );
          }
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

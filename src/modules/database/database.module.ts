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

        const connection = mongoose.createConnection();

        connection.on('connected', () => {
          logger.log(`MongoDB connected successfully at ${uri}`);
        });

        connection.on('disconnected', () => {
          logger.warn('MongoDB connection lost / disconnected');
        });

        connection.on('error', (err) => {
          logger.error(`MongoDB error: ${err.message}`);
        });

        // Attempt connection with fallback so server boots even if DB is offline initially
        connection.openUri(uri, {
          serverSelectionTimeoutMS: 2000,
          connectTimeoutMS: 2000,
          autoIndex: true,
        }).catch((err) => {
          logger.warn(
            `MongoDB initial connection failed (${err.message}). Server started in resilient mode; Mongoose will reconnect when DB is up.`,
          );
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


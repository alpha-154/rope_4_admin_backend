import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import express from 'express';
import helmet from 'helmet';
import * as hpp from 'hpp';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { EnvironmentKey } from './config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Serve uploaded files statically
  const uploadDir = path.resolve(
    configService.get<string>(EnvironmentKey.UPLOAD_DIR) || './uploads',
  );
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadDir));

  // Security middlewares
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );
  app.use(hpp());
  app.use(cookieParser());

  // CORS configuration
  app.enableCors({
    origin: [
      configService.get<string>(EnvironmentKey.FRONTEND_ADMIN_URL) || 'http://localhost:3001',
      configService.get<string>(EnvironmentKey.FRONTEND_WEBSITE_URL) || 'http://localhost:3000',
      'http://localhost:3000',
      'http://localhost:3001',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-organization-id'],
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Global pipes & filters
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new ResponseTransformInterceptor());

  // Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Rope4 Platform API')
    .setDescription('Outdoor Education & Adventure Travel System - Admin & Public Endpoints')
    .setVersion('1.0')
    .addBearerAuth()
    .addApiKey({ type: 'apiKey', name: 'x-organization-id', in: 'header' }, 'x-organization-id')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  const port = configService.get<number>(EnvironmentKey.PORT) || 5001;
  await app.listen(port);

  logger.log(`===============================================`);
  logger.log(`🚀 Rope4 Backend API running on port: ${port}`);
  logger.log(`📚 Swagger Docs available at: http://localhost:${port}/api/docs`);
  logger.log(`🩺 Health check at: http://localhost:${port}/api/health`);
  logger.log(`📁 Static uploads served at: http://localhost:${port}/uploads`);
  logger.log(`===============================================`);
}

bootstrap();

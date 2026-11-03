import { Controller, Get, Optional } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @Optional() @InjectConnection() private readonly connection?: Connection,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Health Check Endpoint' })
  @ApiResponse({ status: 200, description: 'Application is healthy' })
  check() {
    const dbState = this.connection ? this.connection.readyState : 0;
    const dbStatusMap: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };

    return {
      status: 'ok',
      service: 'rope-4-admin-panel-backend',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      database: {
        status: dbStatusMap[dbState] || 'disconnected',
        readyState: dbState,
      },
      environment: process.env.NODE_ENV || 'development',
    };
  }
}

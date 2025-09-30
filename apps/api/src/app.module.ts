import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { TerminusModule } from '@nestjs/terminus';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';

import { AuthModule } from './auth/auth.module';
import { ContractsModule } from './contracts/contracts.module';
import { CustomersModule } from './customers/customers.module';
import { RevenueModule } from './revenue/revenue.module';
import { DACModule } from './dac/dac.module';
import { HealthModule } from './health/health.module';
import { DatabaseModule } from './database/database.module';
import { TelemetryModule } from './telemetry/telemetry.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
        level: process.env['LOG_LEVEL'] || 'info',
        serializers: {
          req: (req) => ({
            method: req.method,
            url: req.url,
            headers: {
              'user-agent': req.headers['user-agent'],
              'content-type': req.headers['content-type'],
            },
          }),
          res: (res) => ({
            statusCode: res.statusCode,
          }),
        },
      },
    }),
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: {
        enabled: true,
      },
    }),
    TerminusModule,
    DatabaseModule,
    TelemetryModule,
    AuthModule,
    ContractsModule,
    CustomersModule,
    RevenueModule,
    DACModule,
    HealthModule,
  ],
})
export class AppModule {}

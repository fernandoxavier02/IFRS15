import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { PrismaService } from '@ifrs15/infra';

@Injectable()
export class HealthService extends HealthIndicator {
  constructor(private prisma: PrismaService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      switch (key) {
        case 'database':
          return await this.checkDatabase();
        default:
          throw new Error(`Unknown health check key: ${key}`);
      }
    } catch (error) {
      throw new HealthCheckError(`${key} check failed`, this.getStatus(key, false, { error: error.message }));
    }
  }

  private async checkDatabase(): Promise<HealthIndicatorResult> {
    try {
      const isHealthy = await this.prisma.healthCheck();
      const result = this.getStatus('database', isHealthy, {
        message: isHealthy ? 'Database connection is healthy' : 'Database connection failed',
      });

      if (!isHealthy) {
        throw new HealthCheckError('Database check failed', result);
      }

      return result;
    } catch (error) {
      throw new HealthCheckError('Database check failed', this.getStatus('database', false, { error: error.message }));
    }
  }
}

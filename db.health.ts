import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
import { PgPoolImpl } from './database.implementations';

@Injectable()
export class DbHealthIndicator extends HealthIndicator {
  constructor(private readonly db: PgPoolImpl) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      await this.db.query('SELECT 1');
      return this.getStatus(key, true);
    } catch (error) {
      const details = error instanceof Error ? { message: error.message } : {};
      throw new HealthCheckError('PostgreSQL check failed', this.getStatus(key, false, details));
    }
  }
}
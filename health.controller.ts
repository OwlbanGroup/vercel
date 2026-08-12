import { Controller, Get } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckService,
  HttpHealthIndicator,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { DbHealthIndicator } from './db.health';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private memory: MemoryHealthIndicator,
    private db: DbHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // The process should not use more than 250MB memory
      () => this.memory.checkHeap('memory_heap', 250 * 1024 * 1024),
      // Pinging an external dependency to check network connectivity
      () => this.http.pingCheck('google', 'https://google.com'),
      // Check the database connection
      () => this.db.isHealthy('postgres-db'),
    ]);
  }
}
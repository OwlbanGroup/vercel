import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HttpModule } from '@nestjs/axios';
import { HealthController } from './health.controller';
import { DbHealthIndicator } from './db.health';

@Module({
  imports: [
    TerminusModule,
    HttpModule, // Required by HttpHealthIndicator
  ],
  controllers: [HealthController],
  // Since DatabaseModule is global, PgPoolImpl is available for injection here.
  providers: [DbHealthIndicator],
})
export class HealthModule {}
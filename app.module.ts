import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseModule } from './database/database.module';
import { redisStore } from 'cache-manager-redis-yet';
import type { RedisClientOptions } from 'redis';
import { UserModule } from './user/user.module';
import { AdminUserModule } from './admin-user.module';
import { validationSchema } from './validation.schema';
import { ClaudeModule } from './claude.module';
import { LoggerMiddleware } from './logger.middleware';
import { HealthModule } from './health.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      useFactory: async (configService: ConfigService) => ({
        store: redisStore,
        url: configService.get<string>('REDIS_URL'),
        ttl: 300, // Cache Time To Live in seconds (e.g., 5 minutes)
        // Other Redis options can be added here, e.g., password, db, etc.
        // See https://github.com/dabroek/node-cache-manager-redis-yet#options
      }),
      inject: [ConfigService],
    }),
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available everywhere
      // Load environment-specific .env file. Defaults to .env.development.
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema,
    }),
    DatabaseModule, // Provides all DB pools globally
    UserModule,     // Provides UserService and configures its DB dependency
    AdminUserModule, // Provides AdminUserService and configures its DB dependency
    ClaudeModule,
    HealthModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(LoggerMiddleware)
      .forRoutes('*'); // Apply to all routes
  }
}
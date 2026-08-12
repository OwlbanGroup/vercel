import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { AdminUserModule } from './admin-user.module';
import { validationSchema } from './validation.schema';
import { ClaudeModule } from './claude.module';
import { LoggerMiddleware } from './logger.middleware';
import { HealthModule } from './health.module';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true, // Make CacheManager available everywhere without importing CacheModule
      ttl: 300, // Cache Time To Live in seconds (e.g., 5 minutes)
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
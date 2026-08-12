import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { AdminUserModule } from './admin-user.module';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available everywhere
      // Load environment-specific .env file. Defaults to .env.development.
      envFilePath: `.env.${process.env.NODE_ENV || 'development'}`,
      validationSchema,
    }),
    DatabaseModule, // Provides all DB pools globally
    UserModule,     // Provides UserService and configures its DB dependency
    AdminUserModule, // Provides AdminUserService and configures its DB dependency
  ],
})
export class AppModule {}
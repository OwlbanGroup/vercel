import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';
import { validationSchema } from './config/validation.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Make ConfigService available everywhere
      validationSchema,
    }),
    DatabaseModule, // Provides all DB pools globally
    UserModule,     // Provides UserService and configures its DB dependency
  ],
})
export class AppModule {}
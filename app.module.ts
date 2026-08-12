import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [
    DatabaseModule, // Provides all DB pools globally
    UserModule,     // Provides UserService and configures its DB dependency
  ],
})
export class AppModule {}
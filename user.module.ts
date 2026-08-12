import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { DbPoolToken } from '../database/database.interfaces';
import { MongoDbClientImpl } from '../database/database.implementations';
import { UserController } from './user.controller';

@Module({
  // No need to import DatabaseModule if it's global
  controllers: [UserController],
  providers: [
    UserService,
    {
      provide: DbPoolToken,
      // Here we specify that UserService gets the MongoDbClientImpl instance
      useExisting: MongoDbClientImpl,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
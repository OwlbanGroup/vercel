import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { DbPoolToken } from '../database/database.interfaces';
import { PgPoolImpl } from '../database/database.implementations';

@Module({
  // No need to import DatabaseModule if it's global
  providers: [
    UserService,
    {
      provide: DbPoolToken,
      // Here we specify that UserService gets the PgPoolImpl instance
      useExisting: PgPoolImpl,
    },
  ],
  exports: [UserService],
})
export class UserModule {}
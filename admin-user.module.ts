import { Module } from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import { DbPoolToken, ADMIN_DB_CONNECTION } from './database.interfaces';

@Module({
  // No need to import DatabaseModule if it's global
  providers: [
    AdminUserService,
    {
      provide: DbPoolToken,
      // Here we specify that AdminUserService gets the separate admin connection
      useExisting: ADMIN_DB_CONNECTION,
    },
  ],
  exports: [AdminUserService],
})
export class AdminUserModule {}
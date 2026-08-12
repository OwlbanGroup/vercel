import { Injectable, Inject } from '@nestjs/common';
import { DbPool, DbPoolToken } from './database.interfaces';

@Injectable()
export class AdminUserService {
  // The service depends on the DbPool interface, not a concrete implementation.
  constructor(@Inject(DbPoolToken) private db: DbPool) {}

  async getAdmins() {
    console.log('[AdminUserService] Fetching admins using a different DB connection... (simulated db call)');
    // In a real app, you would use `this.db` to query the database.
    await new Promise(resolve => setTimeout(resolve, 150));
    return [{ id: 101, name: 'SuperAdmin' }];
  }
}
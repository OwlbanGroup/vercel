import { Injectable, Inject } from '@nestjs/common';
import { DbPool, DbPoolToken } from '../database/database.interfaces';

@Injectable()
export class UserService {
  // The service depends on the DbPool interface, not a concrete implementation.
  constructor(@Inject(DbPoolToken) private db: DbPool) {}

  async getUsers() {
    console.log("[UserService] Fetching users... (simulated db call)");
    // In a real app, you would use `this.db` to query the database.
    // e.g., await (this.db as any).query('SELECT * FROM users');
    await new Promise(resolve => setTimeout(resolve, 150));
    return [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
  }
}
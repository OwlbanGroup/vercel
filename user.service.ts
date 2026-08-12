import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { DbPool, DbPoolToken } from '../database/database.interfaces';
import * as bcrypt from 'bcrypt';

// In a real app, this would be a database entity/model.
export class User {
  id!: number;
  username!: string;
  password?: string; // Hashed password
  roles!: string[];
}

@Injectable()
export class UserService {
  // The service depends on the DbPool interface, not a concrete implementation.
  constructor(@Inject(DbPoolToken) private db: DbPool) {
    // Seed the mock database with a hashed password
    this.seed();
  }

  // --- Mock Database ---
  private users: User[] = [];

  private async seed() {
    const hashedPassword = await bcrypt.hash('password', 10);
    this.users = [
      { id: 1, username: 'testuser', password: hashedPassword, roles: ['admin'] },
      { id: 2, username: 'bob', password: hashedPassword, roles: ['user'] },
    ];
  }
  // --- End Mock Database ---

  async getUsers() {
    console.log('[UserService] Fetching users... (from mock data)');
    // Return users without their passwords
    return this.users.map(({ password, ...user }) => user);
  }

  async findOneByUsername(username: string): Promise<User | undefined> {
    console.log(`[UserService] Finding user by username: ${username} (from mock data)`);
    return this.users.find(user => user.username === username);
  }

  async updateUserRoles(userId: number, roles: string[]): Promise<Omit<User, 'password'>> {
    console.log(`[UserService] Updating roles for user ID: ${userId} (in mock data)`);
    const user = this.users.find(u => u.id === userId);
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found.`);
    }
    user.roles = roles;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, ...result } = user;
    return result;
  }
}
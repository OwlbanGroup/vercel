/**
 * @file Defines the DbPool interface for database connection lifecycle observation.
 * This interface is a simplified, common contract for various database clients,
 * focusing on methods required for graceful termination and cleanup.
 */

import "reflect-metadata"; // Must be imported once at the top of your entry file
import { container, injectable, inject, Lifecycle } from "tsyringe";
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { INestApplication } from '@nestjs/common';


export interface DbPool {
  /**
   * Method to gracefully close or terminate the connection pool.
   * This is commonly found in `pg`, `mysql2`, and `mariadb` pool implementations.
   * It typically returns a Promise that resolves when the pool is fully closed,
   * or is synchronous (`void`).
   */
  end?: () => Promise<void> | void;

  /**
   * Method to close the connection client.
   * This is commonly found in `mongodb` clients.
   * It might accept a `force` boolean parameter to immediately close connections.
   */
  close?: (force?: boolean) => Promise<void> | void;

  /**
   * Method to gracefully disconnect the Redis client.
   * This is typically found in `ioredis` clients.
   */
  quit?: () => Promise<void> | void;
}

// Define a token for the DbPool interface for injection
export const DbPoolToken = Symbol("DbPool");

// --- Example Implementations ---

/**
 * Example implementation for a PostgreSQL-like connection pool.
 * This class simulates the behavior of a `pg` or `mysql2` pool.
 */
@injectable()
export class PgPoolImpl implements DbPool {
  private poolName: string;
  private connections: number;

  constructor(name: string, initialConnections: number = 5) {
    this.poolName = name;
    this.connections = initialConnections;
    console.log(`[${this.poolName}] PgPool initialized with ${this.connections} connections.`);
  }

  async end(): Promise<void> {
    console.log(`[${this.poolName}] PgPool: Gracefully closing ${this.connections} connections...`);
    // Simulate async operation like waiting for active queries to finish
    await new Promise(resolve => setTimeout(resolve, 500));
    this.connections = 0;
    console.log(`[${this.poolName}] PgPool: All connections closed.`);
  }
}

/**
 * Example implementation for a MongoDB-like client.
 * This class simulates the behavior of a `mongodb` client.
 */
@injectable()
export class MongoDbClientImpl implements DbPool {
  private clientName: string;
  private isConnected: boolean;

  constructor(name: string) {
    this.clientName = name;
    this.isConnected = true; // Assume connected on creation
    console.log(`[${this.clientName}] MongoDB Client initialized and connected.`);
  }

  async close(force: boolean = false): Promise<void> {
    if (!this.isConnected) {
      console.log(`[${this.clientName}] MongoDB Client: Already disconnected.`);
      return;
    }
    console.log(`[${this.clientName}] MongoDB Client: Closing connection (force: ${force})...`);
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, force ? 100 : 300));
    this.isConnected = false;
    console.log(`[${this.clientName}] MongoDB Client: Connection closed.`);
  }
}

/**
 * Example implementation for an ioredis-like client.
 * This class simulates the behavior of an `ioredis` client.
 */
@injectable()
export class IoRedisClientImpl implements DbPool {
  private clientName: string;

  constructor(name: string) {
    this.clientName = name;
    console.log(`[${this.clientName}] IoRedis Client initialized.`);
  }

  async quit(): Promise<void> {
    console.log(`[${this.clientName}] IoRedis Client: Sending QUIT command and disconnecting.`);
    await new Promise(resolve => setTimeout(resolve, 200)); // Simulate network delay
    console.log(`[${this.clientName}] IoRedis Client: Disconnected.`);
  }
}

// --- Application Integration with Dependency Injection ---

/**
 * An example service that depends on a database connection.
 * It receives its dependency via the constructor (constructor injection).
 */
class UserService {
  // The service depends on the DbPool interface, not a concrete implementation.
  constructor(@inject(DbPoolToken) private db: DbPool) {}

  async getUsers() {
    console.log("[UserService] Fetching users... (simulated db call)");
    // In a real app, you would use `this.db` to query the database.
    // e.g., await (this.db as any).query('SELECT * FROM users');
    await new Promise(resolve => setTimeout(resolve, 150));
    return [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
  }
}

/**
 * Gracefully shuts down all registered database connections.
 */
async function gracefulShutdown(pools: DbPool[]) {
  const pools = container.getAllDbPools();
  
  // Shut down all pools concurrently for faster exit
  await Promise.all(pools.map(pool => {
    if (pool.end) return pool.end();
    if (pool.close) return pool.close();
    if (pool.quit) return pool.quit();
    return Promise.resolve();
  }));

  console.log("--- All database connections have been closed. Exiting. ---");
  process.exit(0);
}

/**
 * Main application entry point.
 */
async function main() {
async function bootstrap() {
  console.log("\n--- Application Startup ---");

  // 1. Initialization Phase: Create and register dependencies
  // Register concrete implementations as singletons
  container.register(PgPoolImpl, { useClass: PgPoolImpl }, { lifecycle: Lifecycle.Singleton });
  container.register(MongoDbClientImpl, { useClass: MongoDbClientImpl }, { lifecycle: Lifecycle.Singleton });
  container.register(IoRedisClientImpl, { useClass: IoRedisClientImpl }, { lifecycle: Lifecycle.Singleton });
  const app: INestApplication = await NestFactory.create(AppModule);

  // Register DbPoolToken to a specific implementation for UserService
  // Here, UserService will receive the PgPoolImpl instance
  container.register(DbPoolToken, { useExisting: PgPoolImpl });
  // Enable graceful shutdown hooks for NestJS
  // This will trigger OnModuleDestroy hooks in your services
  app.enableShutdownHooks();

  // 2. Application Logic: Resolve dependencies and use them
  const userService = container.resolve(UserService);
  const users = await userService.getUsers();
  console.log("[App] Fetched users:", users);
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log("\nApplication is running. Press Ctrl+C to trigger graceful shutdown.");

  // 3. Graceful Shutdown Setup
  // Collect all DbPool instances for shutdown
  const allDbPools: DbPool[] = [
    container.resolve(PgPoolImpl),
    container.resolve(MongoDbClientImpl),
    container.resolve(IoRedisClientImpl),
  ];
  process.on('SIGINT', () => gracefulShutdown(allDbPools));
  process.on('SIGTERM', () => gracefulShutdown(allDbPools));

  // Keep the process alive to wait for shutdown signal
  // In a real server, this would be `app.listen(...)`
  setInterval(() => {}, 1 << 30);
  console.log(`\nApplication is running on: ${await app.getUrl()}`);
  console.log("Press Ctrl+C to trigger graceful shutdown.");
}

main().catch(error => {
bootstrap().catch(error => {
  console.error("Application failed to start:", error);
  process.exit(1);
});
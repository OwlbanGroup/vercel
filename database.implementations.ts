/**
 * @file Example implementations of database connection pools as NestJS providers.
 * Each provider implements the `OnApplicationShutdown` hook for graceful shutdown.
 */

import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { DbPool } from './database.interfaces';

/**
 * Example implementation for a PostgreSQL-like connection pool.
 */
@Injectable()
export class PgPoolImpl implements DbPool, OnApplicationShutdown {
  private readonly poolName = 'PostgreSQL';
  private connections = 5;

  constructor(connectionString: string) {
    // In a real app, you'd use the connectionString to connect.
    console.log(`[${this.poolName}] Pool initialized for: ${connectionString}`);
  }

  async end(): Promise<void> {
    console.log(`[${this.poolName}] Gracefully closing ${this.connections} connections...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    this.connections = 0;
    console.log(`[${this.poolName}] All connections closed.`);
  }

  async query(sql: string): Promise<{ rows: any[] }> {
    console.log(`[${this.poolName}] Executing health check query: ${sql}`);
    // In a real app, this would execute the query against the database.
    // For a health check, 'SELECT 1' is common and should succeed if the
    // connection is alive. We simulate a successful query.
    await new Promise(resolve => setTimeout(resolve, 50)); // Simulate network latency
    return { rows: [{ '?column?': 1 }] };
  }

  onApplicationShutdown(signal?: string) {
    console.log(`[${this.poolName}] Shutdown triggered by ${signal}. Closing pool.`);
    return this.end();
  }
}

/**
 * Example implementation for a MongoDB-like client.
 */
@Injectable()
export class MongoDbClientImpl implements DbPool, OnApplicationShutdown {
  private readonly clientName = 'MongoDB';
  private isConnected = true;

  constructor(connectionString: string) {
    // In a real app, you'd use the connectionString to connect.
    console.log(`[${this.clientName}] Client initialized for: ${connectionString}`);
  }

  async close(force = false): Promise<void> {
    if (!this.isConnected) return;
    console.log(`[${this.clientName}] Closing connection (force: ${force})...`);
    await new Promise(resolve => setTimeout(resolve, force ? 100 : 300));
    this.isConnected = false;
    console.log(`[${this.clientName}] Connection closed.`);
  }

  onApplicationShutdown(signal?: string) {
    console.log(`[${this.clientName}] Shutdown triggered by ${signal}. Closing client.`);
    return this.close();
  }
}

/**
 * Example implementation for an ioredis-like client.
 */
@Injectable()
export class IoRedisClientImpl implements DbPool, OnApplicationShutdown {
  private readonly clientName = 'Redis';

  constructor(connectionString: string) {
    // In a real app, you'd use the connectionString to connect.
    console.log(`[${this.clientName}] Client initialized for: ${connectionString}`);
  }

  async quit(): Promise<void> {
    console.log(`[${this.clientName}] Sending QUIT command and disconnecting...`);
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log(`[${this.clientName}] Disconnected.`);
  }

  onApplicationShutdown(signal?: string) {
    console.log(`[${this.clientName}] Shutdown triggered by ${signal}. Quitting client.`);
    return this.quit();
  }
}
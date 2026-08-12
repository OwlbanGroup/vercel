/**
 * @file Defines the DbPool interface for database connection lifecycle observation.
 * This interface is a simplified, common contract for various database clients,
 * focusing on methods required for graceful termination and cleanup.
 */

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
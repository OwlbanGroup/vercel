/**
 * @file Defines the DbPool interface for database connection lifecycle observation.
 * This interface is a simplified, common contract for various database clients,
 * focusing on methods required for graceful termination and cleanup.
 */

export interface DbPool {
  /**
   * Method to gracefully close or terminate the connection pool.
   * e.g., `pg`, `mysql2`, `mariadb`
   */
  end?: () => Promise<void> | void;

  /**
   * Method to close the connection client. e.g., `mongodb`
   */
  close?: (force?: boolean) => Promise<void> | void;

  /**
   * Method to gracefully disconnect the client. e.g., `ioredis`
   */
  quit?: () => Promise<void> | void;
}

export const DbPoolToken = Symbol("DbPool");
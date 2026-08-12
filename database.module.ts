import { Module, Global } from '@nestjs/common';
import { PgPoolImpl, MongoDbClientImpl, IoRedisClientImpl } from './database.implementations';

@Global() // Make providers available globally without importing this module everywhere
@Module({
  providers: [
    PgPoolImpl,
    MongoDbClientImpl,
    IoRedisClientImpl
  ],
  exports: [PgPoolImpl, MongoDbClientImpl, IoRedisClientImpl],
})
export class DatabaseModule {}
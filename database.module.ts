import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PgPoolImpl, MongoDbClientImpl, IoRedisClientImpl } from './database.implementations';

@Global() // Make providers available globally without importing this module everywhere
@Module({
  providers: [
    {
      provide: PgPoolImpl,
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('POSTGRES_URL');
        // The validation schema in AppModule ensures this value exists.
        return new PgPoolImpl(connectionString);
      },
      inject: [ConfigService],
    },
    {
      provide: MongoDbClientImpl,
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('MONGO_URL');
        return new MongoDbClientImpl(connectionString);
      },
      inject: [ConfigService],
    },
    {
      provide: IoRedisClientImpl,
      useFactory: (configService: ConfigService) => {
        const connectionString = configService.get<string>('REDIS_URL');
        return new IoRedisClientImpl(connectionString);
      },
      inject: [ConfigService],
    },
  ],
  exports: [PgPoolImpl, MongoDbClientImpl, IoRedisClientImpl],
})
export class DatabaseModule {}
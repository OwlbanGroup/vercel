/**
 * @file Application entry point.
 */

import "reflect-metadata"; // Must be imported once at the top of your entry file
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { UserService } from "./user.service";
import { AdminUserService } from './admin-user.service';

/**
 * Main application entry point.
 */
async function bootstrap() {
  // 1. Create NestJS application instance
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appMode = configService.get<string>('APP_MODE');
  const configService = app.get(ConfigService); // General access still works
  const appMode = configService.get<string>('app.appMode');

  console.log(`\n--- Application Startup (Mode: ${appMode}) ---`);

  // 2. Enable graceful shutdown hooks. This will trigger OnApplicationShutdown
  // hooks in providers, ensuring database connections are closed correctly.
  app.enableShutdownHooks();

  // 3. Application Logic: Resolve dependencies from the NestJS container and use them
  // The `UserModule` configures UserService to use MongoDbClientImpl
  const userService = app.get(UserService);
  const users = await userService.getUsers();
  console.log("[App] Fetched users:", users);

  // The `AdminUserModule` configures AdminUserService to use PgPoolImpl
  const adminUserService = app.get(AdminUserService);
  const admins = await adminUserService.getAdmins();
  console.log("[App] Fetched admins:", admins);

  // 4. Start the application
  const port = process.env.PORT || 3000;
  // 4. Start the application using the typed config value
  const port = configService.get<number>('app.port');
  await app.listen(port);

  console.log(`\nApplication is running on: ${await app.getUrl()}`);
  console.log("Press Ctrl+C to trigger graceful shutdown.");
}

bootstrap().catch(error => {
  console.error("Application failed to start:", error);
  process.exit(1);
});
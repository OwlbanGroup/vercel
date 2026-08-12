/**
 * @file Application entry point.
 */

import "reflect-metadata"; // Must be imported once at the top of your entry file
import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { UserService } from "./src/user/user.service";

/**
 * Main application entry point.
 */
async function bootstrap() {
  console.log("\n--- Application Startup ---");

  // 1. Create NestJS application instance
  const app = await NestFactory.create(AppModule);

  // 2. Enable graceful shutdown hooks. This will trigger OnApplicationShutdown
  // hooks in providers, ensuring database connections are closed correctly.
  app.enableShutdownHooks();

  // 3. Application Logic: Resolve dependencies from the NestJS container and use them
  const userService = app.get(UserService);
  const users = await userService.getUsers();
  console.log("[App] Fetched users:", users);

  // 4. Start the application
  const port = process.env.PORT || 3000;
  await app.listen(port);

  console.log(`\nApplication is running on: ${await app.getUrl()}`);
  console.log("Press Ctrl+C to trigger graceful shutdown.");
}

bootstrap().catch(error => {
  console.error("Application failed to start:", error);
  process.exit(1);
});
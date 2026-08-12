/**
 * @file Application entry point.
 */

import "reflect-metadata"; // Must be imported once at the top of your entry file
import { NestFactory } from '@nestjs/core';
import * as basicAuth from 'express-basic-auth';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { UserService } from "./user.service";
import { AdminUserService } from './admin-user.service';
import { AllExceptionsFilter } from './all-exceptions.filter';

/**
 * Main application entry point.
 */
async function bootstrap() {
  // 1. Create NestJS application instance
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const appMode = configService.get<string>('APP_MODE');

  console.log(`\n--- Application Startup (Mode: ${appMode}) ---`);

  // Enable global validation pipe
  app.useGlobalPipes(new ValidationPipe());

  // Apply our custom global exception filter
  app.useGlobalFilters(new AllExceptionsFilter());

  // Conditionally apply basic auth to Swagger UI in production
  if (appMode === 'production') {
    const swaggerUser = configService.get<string>('SWAGGER_USER');
    const swaggerPassword = configService.get<string>('SWAGGER_PASSWORD');

    app.use(
      ['/api', '/api-json'], // The paths to protect
      basicAuth({
        challenge: true, // This will cause a popup in the browser
        users: { [swaggerUser]: swaggerPassword },
      }),
    );
    console.log('[App] Swagger UI is protected with basic authentication.');
  }

  // Setup Swagger (OpenAPI) documentation
  const config = new DocumentBuilder()
    .setTitle('NestJS API')
    .setDescription('The API description for your NestJS application')
    .setVersion('1.0')
    .addTag('claude', 'Endpoints related to Claude AI interactions')
    .addTag('health', 'Application health check endpoints')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document); // Swagger UI will be available at /api

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
  await app.listen(port);

  console.log(`\nApplication is running on: ${await app.getUrl()}`);
  console.log("Press Ctrl+C to trigger graceful shutdown.");
}

bootstrap().catch(error => {
  console.error("Application failed to start:", error);
  process.exit(1);
});
import {
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  ExceptionFilter,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter to catch all unhandled exceptions and return a standardized JSON response.
 */
@Catch() // The @Catch() decorator without arguments makes this a catch-all filter.
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine the HTTP status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Determine the message to send in the response
    let responseMessage: string | object;
    if (exception instanceof HttpException) {
      const httpResponse = exception.getResponse();
      // Handle cases where getResponse() returns an object (e.g., from ValidationPipe)
      responseMessage = typeof httpResponse === 'string' ? httpResponse : (httpResponse as any).message || httpResponse;
    } else if (exception instanceof Error) {
      responseMessage = exception.message;
    } else {
      responseMessage = 'Internal server error';
    }

    // Log the error for debugging purposes
    this.logger.error(
      `HTTP Status: ${status} - Path: ${request.url} - Message: ${typeof responseMessage === 'string' ? responseMessage : JSON.stringify(responseMessage)}`,
      exception instanceof Error ? exception.stack : undefined,
      'AllExceptionsFilter' // Context for the logger
    );

    // Send a standardized JSON response to the client
    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: responseMessage,
    });
  }
}
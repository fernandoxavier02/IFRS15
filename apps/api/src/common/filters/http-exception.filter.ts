import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = response<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'Internal Server Error';
    let details: any = undefined;

    // Handle HTTP Exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message;
        error = (exceptionResponse as any).error || error;
        details = (exceptionResponse as any).details;
      }
    }
    // Handle Prisma Exceptions
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Database Error';
      
      switch (exception.code) {
        case 'P2002':
          // Unique constraint violation
          message = 'A record with this value already exists';
          details = {
            code: exception.code,
            meta: exception.meta,
          };
          break;
        case 'P2025':
          // Record not found
          status = HttpStatus.NOT_FOUND;
          message = 'Record not found';
          details = {
            code: exception.code,
            meta: exception.meta,
          };
          break;
        case 'P2003':
          // Foreign key constraint violation
          message = 'Related record not found';
          details = {
            code: exception.code,
            meta: exception.meta,
          };
          break;
        default:
          message = 'Database operation failed';
          details = {
            code: exception.code,
            meta: exception.meta,
          };
      }
    }
    // Handle Prisma Validation Errors
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      error = 'Validation Error';
      message = 'Invalid data provided';
      details = {
        type: 'validation',
        message: exception.message,
      };
    }
    // Handle Prisma Initialization Errors
    else if (exception instanceof Prisma.PrismaClientInitializationError) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      error = 'Service Unavailable';
      message = 'Database connection failed';
      this.logger.error('Prisma initialization error:', exception);
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(`Unhandled error: ${exception.message}`, exception.stack);
    }

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
      ...(details && { details }),
    };

    // Log error for monitoring
    this.logger.error(
      `HTTP ${status} Error: ${message}`,
      JSON.stringify({
        ...errorResponse,
        user: (request as any).user?.id,
        tenantId: (request as any).user?.tenantId,
      })
    );

    response.status(status).json(errorResponse);
  }
}

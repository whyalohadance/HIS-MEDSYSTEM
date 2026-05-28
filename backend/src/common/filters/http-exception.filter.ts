import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// NestJS default fields that are not meaningful extras
const NESTJS_DEFAULT_KEYS = new Set(['message', 'statusCode', 'error']);

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const requestId = (request as any).requestId || uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Внутренняя ошибка сервера';
    const extras: Record<string, any> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();

      if (typeof exResponse === 'string') {
        message = exResponse;
      } else {
        const exObj = exResponse as Record<string, any>;
        message = exObj['message'] || message;

        // Collect extra fields (lockedUntil, code, etc.) excluding NestJS defaults
        for (const key of Object.keys(exObj)) {
          if (!NESTJS_DEFAULT_KEYS.has(key)) {
            extras[key] = exObj[key];
          }
        }
      }

      // Если message — массив (ошибки валидации), объединяем
      if (Array.isArray(message)) {
        message = (message as string[]).join(', ');
      }
    }

    if (exception instanceof HttpException) {
      this.logger.error(`[${requestId}] ${status} ${request.method} ${request.url}: ${message}`);
    } else {
      const err = exception as any;
      this.logger.error(
        `[${requestId}] ${status} ${request.method} ${request.url}: ${err?.message || message}`,
        err?.stack,
      );
    }

    response.status(status).json({
      success: false,
      requestId,
      error: { code: status, message, ...extras },
      timestamp: new Date().toISOString(),
    });
  }
}

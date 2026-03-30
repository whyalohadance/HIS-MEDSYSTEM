import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '../dto/response.dto';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Берём requestId из запроса или генерируем новый
    const requestId = (request as any).requestId || uuidv4();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Внутренняя ошибка сервера';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exResponse = exception.getResponse();
      message = typeof exResponse === 'string'
        ? exResponse
        : (exResponse as any).message || message;

      // Если message — массив (ошибки валидации), объединяем
      if (Array.isArray(message)) {
        message = message.join(', ');
      }
    }

    // Логируем реальный exception (не только message для HttpException)
    if (exception instanceof HttpException) {
      this.logger.error(`[${requestId}] ${status} ${request.method} ${request.url}: ${message}`);
    } else {
      const err = exception as any;
      this.logger.error(
        `[${requestId}] ${status} ${request.method} ${request.url}: ${err?.message || message}`,
        err?.stack,
      );
    }

    response.status(status).json(
      ApiResponse.fail(status, message, requestId)
    );
  }
}

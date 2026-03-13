import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { ApiResponse } from '../dto/response.dto';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const requestId = uuidv4();

    // Добавляем requestId в request — будет доступен в контроллерах
    request.requestId = requestId;

    // Логируем входящий запрос
    console.log(`[${requestId}] ${request.method} ${request.url}`);

    return next.handle().pipe(
      map(data => {
        // Если данные уже в формате ApiResponse — не оборачиваем
        if (data && data.hasOwnProperty('success')) return data;
        return ApiResponse.ok(data, requestId);
      }),
    );
  }
}

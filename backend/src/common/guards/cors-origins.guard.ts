import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CorsOriginsGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const origin = request.headers.origin || request.headers.referer || '';

    const allowedOrigins = this.configService
      .get<string>('ALLOWED_ORIGINS', 'http://localhost:4200')
      .split(',')
      .map(o => o.trim());

    // Разрешаем запросы без origin (Postman, curl, server-to-server)
    if (!origin) return true;

    const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed));

    if (!isAllowed) {
      throw new ForbiddenException(`Домен ${origin} не разрешён`);
    }

    return true;
  }
}

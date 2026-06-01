import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { AuditService } from '../../modules/audit/audit.service';
import { AuditAction } from '../../modules/audit/audit-log.entity';

const SKIP_PATTERNS = ['/health', '/audit', '/auth/refresh', '/auth/profile', '/upload', '/backup/download'];
const LOGGED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

const METHOD_TO_ACTION: Record<string, AuditAction> = {
  POST:   AuditAction.CREATE,
  PUT:    AuditAction.UPDATE,
  PATCH:  AuditAction.UPDATE,
  DELETE: AuditAction.DELETE,
};

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  constructor(private readonly auditService: AuditService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    const method: string = req.method;

    if (!LOGGED_METHODS.has(method)) return next.handle();
    if (SKIP_PATTERNS.some(p => req.url?.includes(p))) return next.handle();

    const user = req.user;
    const rawIp = req.headers?.['x-forwarded-for'] || req.ip || req.connection?.remoteAddress || '';
    const ip = String(rawIp).split(',')[0].trim().substring(0, 50);
    const userAgent = (req.headers?.['user-agent'] || '').substring(0, 200);
    const endpoint = (req.url || '').substring(0, 500);

    // Parse resource & resourceId from URL: /api/patients/123 → 'patients', 123
    const pathSegments = endpoint.replace('/api/', '').split('?')[0].split('/');
    const resource = pathSegments[0] || 'unknown';
    const rawId = parseInt(pathSegments[1], 10);
    const resourceId = isNaN(rawId) ? undefined : rawId;

    const action = METHOD_TO_ACTION[method];
    const userId = user?.userId ?? user?.sub ?? null;

    return next.handle().pipe(
      tap(() => {
        // Fire-and-forget: do not await, never throw
        const logData: any = {
          userId,
          action,
          resource,
          method,
          endpoint,
          ip,
          userAgent,
          success: true,
          description: `${method} ${endpoint}`.substring(0, 200),
        };
        if (resourceId !== undefined) logData.resourceId = resourceId;
        this.auditService.log(logData).catch(() => {/* already handled inside service */});
      }),
      catchError((error) => {
        const errData: any = {
          userId,
          action,
          resource,
          method,
          endpoint,
          ip,
          userAgent,
          success: false,
          errorMessage: (error?.message || '').substring(0, 500),
          description: `${method} ${endpoint} FAILED`.substring(0, 200),
        };
        if (resourceId !== undefined) errData.resourceId = resourceId;
        this.auditService.log(errData).catch(() => {});
        throw error;
      }),
    );
  }
}

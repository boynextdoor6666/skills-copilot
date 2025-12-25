import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { appLogger } from './logger/winston';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();
    if (!req) return next.handle();
    const { method, url } = req;
    const userId = req.user?.userId;
    const requestId = req.id || req.headers['x-request-id'];
    const start = Date.now();
    appLogger.info(`→ ${method} ${url} user=${userId ?? '-'} reqId=${requestId ?? '-'}`);

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - start;
        appLogger.info(`← ${method} ${url} ${res?.statusCode} ${duration}ms user=${userId ?? '-'} reqId=${requestId ?? '-'}`);
      }),
      catchError((err) => {
        const res = context.switchToHttp().getResponse();
        const duration = Date.now() - start;
        appLogger.error(`× ${method} ${url} ${res?.statusCode ?? '-'} ${duration}ms user=${userId ?? '-'} reqId=${requestId ?? '-'} msg=${err?.message}`);
        throw err;
      }),
    );
  }
}

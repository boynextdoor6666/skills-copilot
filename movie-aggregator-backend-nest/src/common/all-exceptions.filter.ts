import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { appLogger } from './logger/winston';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof HttpException
      ? (exception.getResponse() as any)
      : (exception as any)?.message || 'Internal server error';

    const method = request?.method;
    const url = request?.url;
    const userId = request?.user?.userId;

    // Log without leaking sensitive data
  appLogger.error(`× ${method} ${url} ${status} user=${userId ?? '-'} reqId=${request?.id ?? '-'} msg=${typeof message === 'string' ? message : JSON.stringify(message)}`);

    try {
      response.status(status).json({
        statusCode: status,
        path: url,
        message: typeof message === 'string' ? message : undefined,
        error: typeof message === 'object' ? message : undefined,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // In non-HTTP contexts or when response isn't available, do nothing extra
    }
  }
}

import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, query, params } = request;
    const userAgent = request.get('user-agent') || '';
    const user = request.user;
    
    const now = Date.now();
    
    this.logger.log(
      `Incoming Request: ${method} ${url}`,
      JSON.stringify({
        method,
        url,
        query,
        params,
        userAgent,
        userId: user?.id,
        tenantId: user?.tenantId,
        timestamp: new Date().toISOString(),
      })
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const responseTime = Date.now() - now;

          this.logger.log(
            `Outgoing Response: ${method} ${url} ${statusCode} - ${responseTime}ms`,
            JSON.stringify({
              method,
              url,
              statusCode,
              responseTime,
              userId: user?.id,
              tenantId: user?.tenantId,
              timestamp: new Date().toISOString(),
            })
          );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          
          this.logger.error(
            `Request Failed: ${method} ${url} - ${responseTime}ms`,
            JSON.stringify({
              method,
              url,
              error: error.message,
              responseTime,
              userId: user?.id,
              tenantId: user?.tenantId,
              timestamp: new Date().toISOString(),
            })
          );
        },
      })
    );
  }
}

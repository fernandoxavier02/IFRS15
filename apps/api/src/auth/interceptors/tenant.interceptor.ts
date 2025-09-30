import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { TenantService } from '../services/tenant.service';
import { AuditLogService, AuditContext } from '../services/audit-log.service';

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(
    private tenantService: TenantService,
    private auditLogService: AuditLogService
  ) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    
    // Extract tenant from JWT token
    const user = request.user;
    if (user?.tenantId) {
      // Set tenant context for RLS
      await this.tenantService.setTenantContext(user.tenantId);
      
      // Prepare audit context
      const auditContext: AuditContext = {
        tenantId: user.tenantId,
        userId: user.id,
        userEmail: user.email,
        userRole: user.role,
        ipAddress: request.ip || request.connection?.remoteAddress,
        userAgent: request.get('User-Agent')
      };
      
      // Inject audit context into request
      request.auditContext = auditContext;
    }

    return next.handle().pipe(
      tap({
        next: (data) => {
          // Log successful operations if needed
          this.logOperation(context, request, 'SUCCESS', data);
        },
        error: (error) => {
          // Log failed operations
          this.logOperation(context, request, 'ERROR', { error: error.message });
        },
        finalize: async () => {
          // Cleanup tenant context
          if (user?.tenantId) {
            await this.tenantService.clearTenantContext();
          }
        }
      })
    );
  }

  private async logOperation(
    context: ExecutionContext,
    request: any,
    status: 'SUCCESS' | 'ERROR',
    data?: any
  ): Promise<void> {
    const auditContext = request.auditContext;
    if (!auditContext) return;

    const handler = context.getHandler();
    const className = context.getClass().name;
    const methodName = handler.name;
    const httpMethod = request.method;
    const url = request.url;

    // Determine if this is a mutation operation
    const isMutation = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(httpMethod);
    
    if (isMutation || this.shouldLogRead(url)) {
      const resource = this.extractResourceFromUrl(url);
      const resourceId = request.params?.id || request.params?.contractId || 'unknown';
      
      const metadata = {
        httpMethod,
        url,
        className,
        methodName,
        status,
        ...(status === 'ERROR' && data ? { error: data.error } : {})
      };

      if (httpMethod === 'POST') {
        await this.auditLogService.logCreate(
          auditContext,
          resource,
          resourceId,
          request.body,
          metadata
        );
      } else if (['PUT', 'PATCH'].includes(httpMethod)) {
        await this.auditLogService.logUpdate(
          auditContext,
          resource,
          resourceId,
          {}, // oldValues would need to be fetched separately
          request.body,
          metadata
        );
      } else if (httpMethod === 'DELETE') {
        await this.auditLogService.logDelete(
          auditContext,
          resource,
          resourceId,
          {}, // oldValues would need to be fetched separately
          metadata
        );
      } else if (httpMethod === 'GET' && this.shouldLogRead(url)) {
        await this.auditLogService.logRead(
          auditContext,
          resource,
          resourceId,
          metadata
        );
      }
    }
  }

  private extractResourceFromUrl(url: string): string {
    // Extract resource name from URL path
    const pathSegments = url.split('/').filter(segment => segment && !segment.startsWith(':'));
    
    // Common resource mappings
    const resourceMap: Record<string, string> = {
      'contratos': 'contracts',
      'revenue': 'revenue',
      'dac': 'dac',
      'policies': 'policies',
      'reports': 'reports',
      'usuarios': 'users',
      'tenants': 'tenants'
    };

    for (const segment of pathSegments) {
      if (resourceMap[segment]) {
        return resourceMap[segment];
      }
    }

    return pathSegments[0] || 'unknown';
  }

  private shouldLogRead(url: string): boolean {
    // Only log reads for sensitive resources
    const sensitivePatterns = [
      '/reports',
      '/audit',
      '/policies',
      '/financial'
    ];

    return sensitivePatterns.some(pattern => url.includes(pattern));
  }
}

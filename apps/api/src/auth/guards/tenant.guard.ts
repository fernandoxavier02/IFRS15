import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.tenantId) {
      throw new ForbiddenException('User must belong to a tenant');
    }

    // Extract tenant context from request (could be from params, headers, or body)
    const tenantId = this.extractTenantId(request);

    if (tenantId && tenantId !== user.tenantId) {
      throw new ForbiddenException('Access denied: tenant mismatch');
    }

    // Set tenant context for the request
    request.tenantId = user.tenantId;
    return true;
  }

  private extractTenantId(request: any): string | null {
    // Try to extract tenant ID from various sources
    return (
      request.params?.tenantId ||
      request.query?.tenantId ||
      request.headers['x-tenant-id'] ||
      request.body?.tenantId ||
      null
    );
  }
}

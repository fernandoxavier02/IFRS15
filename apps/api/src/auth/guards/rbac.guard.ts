import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, hasPermission, canAccessTenant } from '../enums/user-role.enum';
import { PERMISSIONS_KEY, TENANT_ACCESS_KEY } from '../decorators/permissions.decorator';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
  tenantId: string;
  permissions?: string[];
  contractIds?: string[]; // For cliente role
}

@Injectable()
export class RBACGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiresTenantAccess = this.reflector.getAllAndOverride<boolean>(TENANT_ACCESS_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions && !requiresTenantAccess) {
      return true; // No specific permissions required
    }

    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // Check tenant access if required
    if (requiresTenantAccess) {
      const tenantId = this.extractTenantId(request);
      if (tenantId && !canAccessTenant(user.role, tenantId, user.tenantId)) {
        throw new ForbiddenException('Access denied to this tenant');
      }
    }

    // Check permissions
    if (requiredPermissions) {
      const hasRequiredPermission = requiredPermissions.some(permission => {
        // Handle :own scope for cliente role
        if (permission.endsWith(':own') && user.role === UserRole.CLIENTE) {
          return this.checkOwnResourceAccess(permission, request, user);
        }
        
        return hasPermission(user.role, permission);
      });

      if (!hasRequiredPermission) {
        throw new ForbiddenException(`Insufficient permissions. Required: ${requiredPermissions.join(', ')}`);
      }
    }

    // Inject tenant context for RLS
    request.tenantId = user.tenantId;
    request.userRole = user.role;

    return true;
  }

  private extractTenantId(request: any): string | null {
    // Try to extract tenant from various sources
    return request.params?.tenantId || 
           request.query?.tenantId || 
           request.body?.tenantId || 
           request.user?.tenantId;
  }

  private checkOwnResourceAccess(permission: string, request: any, user: AuthenticatedUser): boolean {
    const [resource] = permission.split(':');
    
    switch (resource) {
      case 'contracts':
        const contractId = request.params?.id || request.params?.contractId;
        return user.contractIds?.includes(contractId) || false;
        
      case 'revenue':
        // Check if revenue belongs to user's contracts
        const revenueContractId = request.params?.contractId || request.body?.contractId;
        return user.contractIds?.includes(revenueContractId) || false;
        
      case 'invoices':
        // Similar logic for invoices
        const invoiceContractId = request.params?.contractId || request.body?.contractId;
        return user.contractIds?.includes(invoiceContractId) || false;
        
      default:
        return false;
    }
  }
}

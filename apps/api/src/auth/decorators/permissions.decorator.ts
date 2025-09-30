import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const TENANT_ACCESS_KEY = 'tenant_access';

/**
 * Decorator to specify required permissions for a route
 * @param permissions Array of permission strings
 */
export const RequirePermissions = (...permissions: string[]) => 
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Decorator to indicate that route requires tenant access validation
 */
export const RequireTenantAccess = () => 
  SetMetadata(TENANT_ACCESS_KEY, true);

/**
 * Combined decorator for common RBAC patterns
 */
export const RBAC = {
  // Admin only
  AdminOnly: () => RequirePermissions('admin:*'),
  
  // Financial management
  FinancialManagement: () => RequirePermissions('ifrs15:write', 'policies:write'),
  FinancialRead: () => RequirePermissions('ifrs15:read', 'policies:read'),
  
  // Accounting operations
  AccountingOperations: () => RequirePermissions('contracts:write', 'revenue:write'),
  AccountingRead: () => RequirePermissions('contracts:read', 'revenue:read'),
  
  // Audit access
  AuditRead: () => RequirePermissions('audit:read', 'reports:read'),
  
  // Client access
  ClientRead: () => RequirePermissions('contracts:read:own', 'revenue:read:own'),
  
  // Contract management
  ContractWrite: () => RequirePermissions('contracts:write'),
  ContractRead: () => RequirePermissions('contracts:read'),
  
  // Revenue management
  RevenueWrite: () => RequirePermissions('revenue:write'),
  RevenueRead: () => RequirePermissions('revenue:read'),
  RevenueReprocess: () => RequirePermissions('revenue:reprocess'),
  
  // DAC management
  DACWrite: () => RequirePermissions('dac:write'),
  DACRead: () => RequirePermissions('dac:read'),
  
  // Policy management
  PolicyWrite: () => RequirePermissions('policies:write'),
  PolicyRead: () => RequirePermissions('policies:read'),
  
  // Reports
  ReportsRead: () => RequirePermissions('reports:read'),
  
  // Snapshots
  SnapshotsRead: () => RequirePermissions('snapshots:read'),
  
  // Multi-tenant combinations
  TenantAdmin: () => [RequirePermissions('*'), RequireTenantAccess()],
  TenantFinancial: () => [RequirePermissions('ifrs15:write', 'policies:write'), RequireTenantAccess()],
  TenantAccounting: () => [RequirePermissions('contracts:write', 'revenue:write'), RequireTenantAccess()],
  TenantAudit: () => [RequirePermissions('audit:read', 'reports:read'), RequireTenantAccess()],
  TenantClient: () => [RequirePermissions('contracts:read:own'), RequireTenantAccess()]
};

/**
 * Decorator to apply multiple decorators at once
 */
export function ApplyDecorators(...decorators: (MethodDecorator | ClassDecorator)[]): MethodDecorator {
  return (target: any, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    decorators.forEach(decorator => {
      if (propertyKey && descriptor) {
        (decorator as MethodDecorator)(target, propertyKey, descriptor);
      } else {
        (decorator as ClassDecorator)(target);
      }
    });
  };
}

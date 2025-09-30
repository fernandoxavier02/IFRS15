export enum UserRole {
  ADMIN_ORG = 'admin_org',
  GERENTE_FINANCEIRO = 'gerente_financeiro', 
  CONTABILIDADE = 'contabilidade',
  AUDITOR_EXTERNO = 'auditor_externo',
  CLIENTE = 'cliente'
}

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN_ORG]: {
    description: 'Acesso total no tenant',
    permissions: ['*'],
    scopes: ['tenant:*']
  },
  [UserRole.GERENTE_FINANCEIRO]: {
    description: 'Gestão IFRS15 + políticas',
    permissions: [
      'ifrs15:read',
      'ifrs15:write', 
      'policies:read',
      'policies:write',
      'contracts:read',
      'contracts:write',
      'revenue:read',
      'revenue:write',
      'dac:read',
      'dac:write',
      'reports:read'
    ],
    scopes: ['tenant:manage']
  },
  [UserRole.CONTABILIDADE]: {
    description: 'Operacionalizar contratos, faturamento, reestimativas',
    permissions: [
      'contracts:read',
      'contracts:write',
      'contracts:reestimate',
      'revenue:read',
      'revenue:write',
      'revenue:reprocess',
      'dac:read',
      'dac:write',
      'invoicing:read',
      'invoicing:write',
      'reports:read'
    ],
    scopes: ['tenant:operate']
  },
  [UserRole.AUDITOR_EXTERNO]: {
    description: 'Leitura somente + relatórios e snapshots',
    permissions: [
      'contracts:read',
      'revenue:read',
      'dac:read',
      'policies:read',
      'reports:read',
      'snapshots:read',
      'audit:read'
    ],
    scopes: ['tenant:audit']
  },
  [UserRole.CLIENTE]: {
    description: 'Leitura do próprio contrato/PO/fatura e relatórios acordados',
    permissions: [
      'contracts:read:own',
      'revenue:read:own',
      'invoices:read:own',
      'reports:read:own'
    ],
    scopes: ['contract:own']
  }
};

export function hasPermission(userRole: UserRole, permission: string): boolean {
  const rolePermissions = ROLE_PERMISSIONS[userRole];
  if (!rolePermissions) return false;
  
  // Admin has all permissions
  if (rolePermissions.permissions.includes('*')) return true;
  
  // Check exact permission
  if (rolePermissions.permissions.includes(permission)) return true;
  
  // Check wildcard permissions
  const [resource, action, scope] = permission.split(':');
  const wildcardPermission = `${resource}:*`;
  if (rolePermissions.permissions.includes(wildcardPermission)) return true;
  
  return false;
}

export function canAccessTenant(userRole: UserRole, tenantId: string, userTenantId: string): boolean {
  // Admin and tenant-scoped roles can access their tenant
  if (userTenantId === tenantId) return true;
  
  // External auditor can access multiple tenants if authorized
  if (userRole === UserRole.AUDITOR_EXTERNO) {
    // This would be checked against audit_access table in real implementation
    return true;
  }
  
  return false;
}

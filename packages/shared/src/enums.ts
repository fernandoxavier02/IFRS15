// Enums used across the application
export enum UserRole {
  ADMIN_ORG = 'admin_org',
  GERENTE_FINANCEIRO = 'gerente_financeiro',
  CONTABILIDADE = 'contabilidade',
  AUDITOR_EXTERNO = 'auditor_externo',
  CLIENTE = 'cliente',
}

export enum Permission {
  // Contract permissions
  CONTRACT_CREATE = 'contract:create',
  CONTRACT_READ = 'contract:read',
  CONTRACT_UPDATE = 'contract:update',
  CONTRACT_DELETE = 'contract:delete',
  
  // Revenue recognition permissions
  REVENUE_CREATE = 'revenue:create',
  REVENUE_READ = 'revenue:read',
  REVENUE_UPDATE = 'revenue:update',
  REVENUE_DELETE = 'revenue:delete',
  
  // Customer permissions
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_READ = 'customer:read',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',
  
  // Tenant management
  TENANT_MANAGE = 'tenant:manage',
  USER_MANAGE = 'user:manage',
  
  // Reports
  REPORTS_VIEW = 'reports:view',
  REPORTS_EXPORT = 'reports:export',
  
  // Audit
  AUDIT_VIEW = 'audit:view',
}

export enum ContractStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  ON_HOLD = 'on_hold',
}

export enum SatisfactionMethod {
  OVER_TIME = 'over_time',
  POINT_IN_TIME = 'point_in_time',
}

export enum RevenueRecognitionStatus {
  PENDING = 'pending',
  RECOGNIZED = 'recognized',
  REVERSED = 'reversed',
}

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  EXPORT = 'export',
}

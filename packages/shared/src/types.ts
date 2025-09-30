// Common types used across the application
import { UserRole, Permission, ContractStatus, SatisfactionMethod } from './enums';

export interface User {
  id: string;
  email: string;
  name: string;
  tenantId: string;
  roles: UserRole[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  isActive: boolean;
  settings: TenantSettings;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettings {
  currency: string;
  locale: string;
  timezone: string;
  fiscalYearStart: number; // Month (1-12)
}

export interface Contract {
  id: string;
  tenantId: string;
  customerId: string;
  contractNumber: string;
  title: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  totalValue: number;
  currency: string;
  status: ContractStatus;
  performanceObligations: PerformanceObligation[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PerformanceObligation {
  id: string;
  contractId: string;
  description: string;
  allocatedAmount: number;
  recognizedAmount: number;
  isDistinct: boolean;
  satisfactionMethod: SatisfactionMethod;
  estimatedCompletionDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  taxId?: string;
  address?: Address;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface RevenueRecognition {
  id: string;
  tenantId: string;
  contractId: string;
  performanceObligationId: string;
  amount: number;
  recognitionDate: Date;
  period: string; // YYYY-MM format
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  pagination?: PaginationMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Authentication types
export interface JwtPayload {
  sub: string; // user id
  email: string;
  tenantId: string;
  roles: UserRole[];
  iat: number;
  exp: number;
}

export interface AuthContext {
  user: User;
  tenant: Tenant;
  permissions: Permission[];
}

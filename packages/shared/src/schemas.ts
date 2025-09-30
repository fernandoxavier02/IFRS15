import { z } from 'zod';
import { UserRole, ContractStatus, SatisfactionMethod } from './enums';

// User schemas
export const CreateUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(255),
  tenantId: z.string().uuid(),
  roles: z.array(z.nativeEnum(UserRole)),
});

export const UpdateUserSchema = CreateUserSchema.partial().omit({ tenantId: true });

// Tenant schemas
export const CreateTenantSchema = z.object({
  name: z.string().min(1).max(255),
  domain: z.string().min(1).max(255),
  settings: z.object({
    currency: z.string().length(3),
    locale: z.string().min(2).max(10),
    timezone: z.string(),
    fiscalYearStart: z.number().min(1).max(12),
  }),
});

export const UpdateTenantSchema = CreateTenantSchema.partial();

// Contract schemas
export const CreateContractSchema = z.object({
  customerId: z.string().uuid(),
  contractNumber: z.string().min(1).max(100),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  startDate: z.coerce.date(),
  endDate: z.coerce.date().optional(),
  totalValue: z.number().positive(),
  currency: z.string().length(3),
  status: z.nativeEnum(ContractStatus),
});

export const UpdateContractSchema = CreateContractSchema.partial();

// Performance Obligation schemas
export const CreatePerformanceObligationSchema = z.object({
  contractId: z.string().uuid(),
  description: z.string().min(1).max(500),
  allocatedAmount: z.number().positive(),
  isDistinct: z.boolean(),
  satisfactionMethod: z.nativeEnum(SatisfactionMethod),
  estimatedCompletionDate: z.coerce.date().optional(),
});

export const UpdatePerformanceObligationSchema = CreatePerformanceObligationSchema.partial().omit({ contractId: true });

// Customer schemas
export const CreateCustomerSchema = z.object({
  name: z.string().min(1).max(255),
  email: z.string().email().optional(),
  taxId: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string(),
  }).optional(),
});

export const UpdateCustomerSchema = CreateCustomerSchema.partial();

// Revenue Recognition schemas
export const CreateRevenueRecognitionSchema = z.object({
  contractId: z.string().uuid(),
  performanceObligationId: z.string().uuid(),
  amount: z.number().positive(),
  recognitionDate: z.coerce.date(),
  period: z.string().regex(/^\d{4}-\d{2}$/),
  description: z.string().optional(),
});

export const UpdateRevenueRecognitionSchema = CreateRevenueRecognitionSchema.partial().omit({ 
  contractId: true, 
  performanceObligationId: true 
});

// Query schemas
export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const ContractQuerySchema = PaginationQuerySchema.extend({
  customerId: z.string().uuid().optional(),
  status: z.nativeEnum(ContractStatus).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export const RevenueQuerySchema = PaginationQuerySchema.extend({
  contractId: z.string().uuid().optional(),
  period: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

// Type exports
export type CreateUserDto = z.infer<typeof CreateUserSchema>;
export type UpdateUserDto = z.infer<typeof UpdateUserSchema>;
export type CreateTenantDto = z.infer<typeof CreateTenantSchema>;
export type UpdateTenantDto = z.infer<typeof UpdateTenantSchema>;
export type CreateContractDto = z.infer<typeof CreateContractSchema>;
export type UpdateContractDto = z.infer<typeof UpdateContractSchema>;
export type CreatePerformanceObligationDto = z.infer<typeof CreatePerformanceObligationSchema>;
export type UpdatePerformanceObligationDto = z.infer<typeof UpdatePerformanceObligationSchema>;
export type CreateCustomerDto = z.infer<typeof CreateCustomerSchema>;
export type UpdateCustomerDto = z.infer<typeof UpdateCustomerSchema>;
export type CreateRevenueRecognitionDto = z.infer<typeof CreateRevenueRecognitionSchema>;
export type UpdateRevenueRecognitionDto = z.infer<typeof UpdateRevenueRecognitionSchema>;
export type PaginationQueryDto = z.infer<typeof PaginationQuerySchema>;
export type ContractQueryDto = z.infer<typeof ContractQuerySchema>;
export type RevenueQueryDto = z.infer<typeof RevenueQuerySchema>;

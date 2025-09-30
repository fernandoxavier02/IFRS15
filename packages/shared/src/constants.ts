// Application constants
export const APP_CONFIG = {
  NAME: 'IFRS 15 Revenue Recognition',
  VERSION: '1.0.0',
  DESCRIPTION: 'IFRS 15 compliant revenue recognition system',
} as const;

// API Configuration
export const API_CONFIG = {
  BASE_URL: process.env['API_BASE_URL'] || 'http://localhost:3000',
  VERSION: 'v1',
  TIMEOUT: 30000,
} as const;

// Authentication
export const AUTH_CONFIG = {
  JWT_EXPIRY: '24h',
  REFRESH_TOKEN_EXPIRY: '7d',
  COOKIE_NAME: 'ifrs15_token',
  HEADER_NAME: 'Authorization',
} as const;

// Pagination
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

// Date formats
export const DATE_FORMATS = {
  ISO: 'YYYY-MM-DD',
  DISPLAY: 'DD/MM/YYYY',
  PERIOD: 'YYYY-MM',
  DATETIME: 'DD/MM/YYYY HH:mm:ss',
} as const;

// Currency
export const CURRENCIES = {
  BRL: 'BRL',
  USD: 'USD',
  EUR: 'EUR',
} as const;

// Locales
export const LOCALES = {
  PT_BR: 'pt-BR',
  EN_US: 'en-US',
} as const;

// Role-Permission mapping
export const ROLE_PERMISSIONS = {
  admin_org: [
    'contract:create', 'contract:read', 'contract:update', 'contract:delete',
    'revenue:create', 'revenue:read', 'revenue:update', 'revenue:delete',
    'customer:create', 'customer:read', 'customer:update', 'customer:delete',
    'tenant:manage', 'user:manage',
    'reports:view', 'reports:export',
    'audit:view',
  ],
  gerente_financeiro: [
    'contract:create', 'contract:read', 'contract:update',
    'revenue:create', 'revenue:read', 'revenue:update',
    'customer:create', 'customer:read', 'customer:update',
    'reports:view', 'reports:export',
  ],
  contabilidade: [
    'contract:read',
    'revenue:create', 'revenue:read', 'revenue:update',
    'customer:read',
    'reports:view', 'reports:export',
  ],
  auditor_externo: [
    'contract:read',
    'revenue:read',
    'customer:read',
    'reports:view',
    'audit:view',
  ],
  cliente: [
    'contract:read',
    'revenue:read',
    'reports:view',
  ],
} as const;

// Validation messages
export const VALIDATION_MESSAGES = {
  REQUIRED: 'Este campo é obrigatório',
  EMAIL_INVALID: 'Email inválido',
  MIN_LENGTH: 'Mínimo de {min} caracteres',
  MAX_LENGTH: 'Máximo de {max} caracteres',
  POSITIVE_NUMBER: 'Deve ser um número positivo',
  INVALID_DATE: 'Data inválida',
  INVALID_UUID: 'ID inválido',
} as const;

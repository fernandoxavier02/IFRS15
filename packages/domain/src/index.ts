// Domain layer exports
export * from './entities';
export * from './value-objects';
export * from './services';
export * from './repositories';
export * from './events';

// Policy Engine exports - explicit re-exports to avoid naming conflicts
export {
  IFRS15PolicyEngine,
  createPolicyEngine,
  policyEngine,
  IFRS15Validator,
  PriceAllocationCalculator,
  RevenueScheduleCalculator,
  ContractBalanceCalculator,
  AccountingEntryGenerator
} from './policy-engine';

export type {
  ContractPolicy,
  PolicyEngineOutput,
  PriceAllocationPlan,
  RevenueSchedule,
  ContractBalance,
  AccountingEntry,
  PerformanceObligationPolicy,
  RevenueRecognitionMethod,
  ProgressMetric,
  VariableConsiderationConstraint,
  LicenseType,
  ContractModificationType
} from './policy-engine';

// Re-export ValidationResult from policy engine with alias to avoid conflict
export type { ValidationResult as PolicyValidationResult } from './policy-engine';

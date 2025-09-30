// ============================================================================
// IFRS 15 POLICY ENGINE - MAIN EXPORTS
// ============================================================================

// Core engine
export { IFRS15PolicyEngine, createPolicyEngine, policyEngine } from './engine';

// Validators
export { IFRS15Validator } from './validators';

// Calculators
export {
  PriceAllocationCalculator,
  RevenueScheduleCalculator,
  ContractBalanceCalculator,
  AccountingEntryGenerator
} from './calculators';

// Types and schemas
export * from './types';

// Re-export commonly used types for convenience
export type {
  ContractPolicy,
  PolicyEngineOutput,
  ValidationResult,
  ContractValidation,
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
} from './types';

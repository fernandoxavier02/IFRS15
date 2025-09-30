import { z } from 'zod';

// ============================================================================
// IFRS 15 POLICY ENGINE - TYPES AND SCHEMAS
// ============================================================================

// Enums for IFRS 15 parameters
export const RevenueRecognitionMethodSchema = z.enum([
  'POINT_IN_TIME',
  'OVER_TIME_INPUT',
  'OVER_TIME_OUTPUT',
  'OVER_TIME_MILESTONE',
  'OVER_TIME_COST_TO_COST',
  'OVER_TIME_UNITS_OF_DELIVERY'
]);

export const ProgressMetricSchema = z.enum([
  'COSTS_INCURRED',
  'LABOR_HOURS',
  'UNITS_DELIVERED',
  'TIME_ELAPSED',
  'MILESTONES_ACHIEVED',
  'SURVEYS_OF_WORK'
]);

export const VariableConsiderationConstraintSchema = z.enum([
  'MOST_LIKELY_AMOUNT',
  'EXPECTED_VALUE',
  'CONSTRAINED_ESTIMATE',
  'UNCONSTRAINED_ESTIMATE'
]);

export const WarrantyClassificationSchema = z.enum([
  'ASSURANCE_WARRANTY',
  'SERVICE_WARRANTY',
  'HYBRID_WARRANTY'
]);

export const PrincipalAgentRoleSchema = z.enum([
  'PRINCIPAL',
  'AGENT'
]);

export const LicenseTypeSchema = z.enum([
  'RIGHT_TO_USE',
  'RIGHT_TO_ACCESS',
  'FUNCTIONAL_IP',
  'SYMBOLIC_IP'
]);

export const ContractModificationTypeSchema = z.enum([
  'PROSPECTIVE',
  'RETROSPECTIVE',
  'CUMULATIVE_CATCH_UP'
]);

// Core Policy Schemas
export const FinancingComponentSchema = z.object({
  hasSignificantFinancing: z.boolean(),
  effectiveInterestRate: z.number().min(0).max(1).optional(),
  discountRate: z.number().min(0).max(1).optional(),
  paymentTermsMonths: z.number().int().min(0).optional()
});

export const MaterialRightSchema = z.object({
  hasMaterialRight: z.boolean(),
  optionExerciseProbability: z.number().min(0).max(1).optional(),
  standaloneSellingPrice: z.number().min(0).optional(),
  discountPercentage: z.number().min(0).max(1).optional()
});

export const UpfrontFeeSchema = z.object({
  hasUpfrontFee: z.boolean(),
  amount: z.number().min(0).optional(),
  treatmentMethod: z.enum(['CAPITALIZE', 'EXPENSE', 'ALLOCATE']).optional(),
  amortizationPeriodMonths: z.number().int().min(0).optional()
});

export const PerformanceObligationPolicySchema = z.object({
  id: z.string(),
  description: z.string(),
  revenueRecognitionMethod: RevenueRecognitionMethodSchema,
  progressMetric: ProgressMetricSchema.optional(),
  isDistinct: z.boolean(),
  standaloneSellingPrice: z.number().min(0).optional(),
  allocationWeight: z.number().min(0).max(1).optional(),
  satisfactionTiming: z.enum(['AT_POINT_IN_TIME', 'OVER_TIME']),
  controlTransferIndicators: z.array(z.string()).optional(),
  warrantyClassification: WarrantyClassificationSchema.optional(),
  principalAgentRole: PrincipalAgentRoleSchema.optional(),
  licenseType: LicenseTypeSchema.optional(),
  materialRight: MaterialRightSchema.optional()
});

export const ContractPolicySchema = z.object({
  contractId: z.string(),
  tenantId: z.string(),
  policyVersion: z.string().default('1.0.0'),
  effectiveDate: z.string().datetime(),
  
  // Contract-level parameters
  hasCommercialSubstance: z.boolean(),
  isEnforceable: z.boolean(),
  enforceablePeriodMonths: z.number().int().min(0),
  
  // Transaction price parameters
  transactionPrice: z.number().min(0),
  variableConsiderationConstraint: VariableConsiderationConstraintSchema,
  constraintThreshold: z.number().min(0).max(1).default(0.05),
  
  // Financing and timing
  financingComponent: FinancingComponentSchema,
  upfrontFee: UpfrontFeeSchema,
  
  // Performance obligations
  performanceObligations: z.array(PerformanceObligationPolicySchema).min(1),
  
  // Modification handling
  modificationTreatment: ContractModificationTypeSchema.default('PROSPECTIVE'),
  
  // Custom rules and overrides
  customRules: z.record(z.any()).optional(),
  overrides: z.record(z.any()).optional()
});

// Validation Results
export const ValidationResultSchema = z.object({
  isValid: z.boolean(),
  step: z.enum(['STEP_1', 'STEP_2', 'STEP_3', 'STEP_4', 'STEP_5']),
  errors: z.array(z.string()),
  warnings: z.array(z.string()),
  recommendations: z.array(z.string()).optional()
});

export const ContractValidationSchema = z.object({
  contractId: z.string(),
  overallValid: z.boolean(),
  stepResults: z.array(ValidationResultSchema),
  summary: z.object({
    totalErrors: z.number().int().min(0),
    totalWarnings: z.number().int().min(0),
    criticalIssues: z.array(z.string())
  })
});

// Output Schemas
export const PriceAllocationItemSchema = z.object({
  performanceObligationId: z.string(),
  standaloneSellingPrice: z.number().min(0),
  allocationBasis: z.enum(['STANDALONE_PRICE', 'RESIDUAL', 'ADJUSTED_MARKET']),
  allocatedAmount: z.number().min(0),
  allocationPercentage: z.number().min(0).max(1),
  adjustments: z.array(z.object({
    type: z.string(),
    amount: z.number(),
    reason: z.string()
  })).optional()
});

export const PriceAllocationPlanSchema = z.object({
  contractId: z.string(),
  totalTransactionPrice: z.number().min(0),
  allocationMethod: z.enum(['STANDALONE_PRICE', 'RESIDUAL', 'COST_PLUS_MARGIN']),
  allocations: z.array(PriceAllocationItemSchema),
  variableConsiderationTreatment: z.string().optional(),
  discountAllocation: z.number().optional()
});

export const RevenueScheduleItemSchema = z.object({
  date: z.string().datetime(),
  performanceObligationId: z.string(),
  recognizedAmount: z.number().min(0),
  cumulativeAmount: z.number().min(0),
  progressPercentage: z.number().min(0).max(1),
  progressMeasurement: z.string().optional(),
  adjustments: z.array(z.object({
    type: z.string(),
    amount: z.number(),
    reason: z.string()
  })).optional()
});

export const RevenueScheduleSchema = z.object({
  contractId: z.string(),
  performanceObligationId: z.string(),
  totalAllocatedAmount: z.number().min(0),
  recognitionMethod: RevenueRecognitionMethodSchema,
  schedule: z.array(RevenueScheduleItemSchema),
  completionDate: z.string().datetime().optional(),
  estimatedDuration: z.number().int().min(0).optional()
});

export const ContractBalanceSchema = z.object({
  contractId: z.string(),
  asOfDate: z.string().datetime(),
  contractAsset: z.number().default(0),
  contractLiability: z.number().default(0),
  refundLiability: z.number().default(0),
  unbilledRevenue: z.number().default(0),
  deferredRevenue: z.number().default(0),
  incrementalCosts: z.number().default(0),
  totalContractValue: z.number().min(0),
  recognizedToDate: z.number().min(0),
  remainingToRecognize: z.number().min(0)
});

export const AccountingEntrySchema = z.object({
  date: z.string().datetime(),
  description: z.string(),
  debitAccount: z.string(),
  creditAccount: z.string(),
  amount: z.number().min(0),
  performanceObligationId: z.string().optional(),
  reference: z.string().optional(),
  entryType: z.enum([
    'REVENUE_RECOGNITION',
    'CONTRACT_ASSET',
    'CONTRACT_LIABILITY',
    'REFUND_LIABILITY',
    'INCREMENTAL_COST',
    'COST_AMORTIZATION'
  ])
});

export const PolicyEngineOutputSchema = z.object({
  contractId: z.string(),
  generatedAt: z.string().datetime(),
  validation: ContractValidationSchema,
  priceAllocation: PriceAllocationPlanSchema,
  revenueSchedules: z.array(RevenueScheduleSchema),
  contractBalances: ContractBalanceSchema,
  suggestedEntries: z.array(AccountingEntrySchema),
  metadata: z.object({
    policyVersion: z.string(),
    engineVersion: z.string(),
    processingTimeMs: z.number().int().min(0)
  })
});

// Type exports
export type RevenueRecognitionMethod = z.infer<typeof RevenueRecognitionMethodSchema>;
export type ProgressMetric = z.infer<typeof ProgressMetricSchema>;
export type VariableConsiderationConstraint = z.infer<typeof VariableConsiderationConstraintSchema>;
export type WarrantyClassification = z.infer<typeof WarrantyClassificationSchema>;
export type PrincipalAgentRole = z.infer<typeof PrincipalAgentRoleSchema>;
export type LicenseType = z.infer<typeof LicenseTypeSchema>;
export type ContractModificationType = z.infer<typeof ContractModificationTypeSchema>;

export type FinancingComponent = z.infer<typeof FinancingComponentSchema>;
export type MaterialRight = z.infer<typeof MaterialRightSchema>;
export type UpfrontFee = z.infer<typeof UpfrontFeeSchema>;
export type PerformanceObligationPolicy = z.infer<typeof PerformanceObligationPolicySchema>;
export type ContractPolicy = z.infer<typeof ContractPolicySchema>;

export type ValidationResult = z.infer<typeof ValidationResultSchema>;
export type ContractValidation = z.infer<typeof ContractValidationSchema>;

export type PriceAllocationItem = z.infer<typeof PriceAllocationItemSchema>;
export type PriceAllocationPlan = z.infer<typeof PriceAllocationPlanSchema>;
export type RevenueScheduleItem = z.infer<typeof RevenueScheduleItemSchema>;
export type RevenueSchedule = z.infer<typeof RevenueScheduleSchema>;
export type ContractBalance = z.infer<typeof ContractBalanceSchema>;
export type AccountingEntry = z.infer<typeof AccountingEntrySchema>;
export type PolicyEngineOutput = z.infer<typeof PolicyEngineOutputSchema>;

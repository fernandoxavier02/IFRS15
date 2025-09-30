# IFRS 15 Policy Engine

A comprehensive, parametrizable policy engine for IFRS 15 Revenue Recognition compliance.

## Overview

The IFRS 15 Policy Engine provides a complete implementation of the 5-step revenue recognition model with support for:

- **Policy-driven configuration** via YAML/JSON
- **Complete IFRS 15 validation** across all 5 steps
- **Flexible revenue recognition methods** (point-in-time, over-time)
- **Advanced contract scenarios** (licenses, warranties, modifications)
- **Automated calculations** (price allocation, revenue schedules, contract balances)
- **Accounting entry generation** with suggested journal entries

## Quick Start

```typescript
import { IFRS15PolicyEngine } from '@ifrs15/domain/policy-engine';

const engine = new IFRS15PolicyEngine();

// Process a contract with policy configuration
const result = await engine.processContract(
  policyData,
  new Date('2024-01-01'), // Contract start
  new Date('2024-12-31'), // Contract end
  {
    asOfDate: new Date(),
    billedToDate: 50000,
    generateAccountingEntries: true
  }
);

console.log('Validation:', result.validation.overallValid);
console.log('Price Allocation:', result.priceAllocation);
console.log('Revenue Schedules:', result.revenueSchedules);
console.log('Contract Balances:', result.contractBalances);
console.log('Suggested Entries:', result.suggestedEntries);
```

## Policy Configuration

### Contract-Level Parameters

```yaml
contractId: "CONTRACT-2024-001"
tenantId: "tenant-acme-corp"
policyVersion: "1.0.0"
effectiveDate: "2024-01-01T00:00:00Z"

# Contract enforceability
hasCommercialSubstance: true
isEnforceable: true
enforceablePeriodMonths: 36

# Transaction price
transactionPrice: 500000
variableConsiderationConstraint: "CONSTRAINED_ESTIMATE"
constraintThreshold: 0.05

# Financing component
financingComponent:
  hasSignificantFinancing: true
  effectiveInterestRate: 0.08
  paymentTermsMonths: 12

# Upfront fees
upfrontFee:
  hasUpfrontFee: true
  amount: 50000
  treatmentMethod: "ALLOCATE"
```

### Performance Obligation Parameters

```yaml
performanceObligations:
  - id: "PO-LICENSE"
    description: "Software license (right to use)"
    revenueRecognitionMethod: "POINT_IN_TIME"
    isDistinct: true
    standaloneSellingPrice: 300000
    satisfactionTiming: "AT_POINT_IN_TIME"
    licenseType: "RIGHT_TO_USE"
    principalAgentRole: "PRINCIPAL"
    
  - id: "PO-SUPPORT"
    description: "Technical support and maintenance"
    revenueRecognitionMethod: "OVER_TIME_INPUT"
    progressMetric: "TIME_ELAPSED"
    isDistinct: true
    standaloneSellingPrice: 50000
    satisfactionTiming: "OVER_TIME"
    warrantyClassification: "SERVICE_WARRANTY"
```

## Revenue Recognition Methods

### Point in Time
- `POINT_IN_TIME` - Revenue recognized when control transfers

### Over Time Methods
- `OVER_TIME_INPUT` - Input-based (costs, labor hours, time elapsed)
- `OVER_TIME_OUTPUT` - Output-based (units delivered, milestones)
- `OVER_TIME_MILESTONE` - Milestone-based recognition
- `OVER_TIME_COST_TO_COST` - Cost-to-cost method
- `OVER_TIME_UNITS_OF_DELIVERY` - Units of delivery method

## Progress Metrics

- `COSTS_INCURRED` - Based on costs incurred to date
- `LABOR_HOURS` - Based on labor hours worked
- `UNITS_DELIVERED` - Based on units delivered to customer
- `TIME_ELAPSED` - Straight-line time-based
- `MILESTONES_ACHIEVED` - Based on milestone completion
- `SURVEYS_OF_WORK` - Based on surveys of work performed

## License Types

### Functional IP (Right to Use)
- `RIGHT_TO_USE` - License to use IP as it exists
- `FUNCTIONAL_IP` - IP that is substantially the same over time

### Symbolic IP (Right to Access)
- `RIGHT_TO_ACCESS` - License to access IP as it changes
- `SYMBOLIC_IP` - IP that changes significantly over time

## Variable Consideration Constraints

- `MOST_LIKELY_AMOUNT` - Single most likely outcome
- `EXPECTED_VALUE` - Probability-weighted expected value
- `CONSTRAINED_ESTIMATE` - Apply constraint to reduce variability
- `UNCONSTRAINED_ESTIMATE` - No constraint applied

## Contract Modification Types

- `PROSPECTIVE` - Apply changes going forward only
- `RETROSPECTIVE` - Restate prior periods as if modified from inception
- `CUMULATIVE_CATCH_UP` - Adjust current period for cumulative effect

## Validation Rules

### Step 1: Identify Contract
- ✅ Contract must be enforceable
- ✅ Must have commercial substance
- ✅ Transaction price must be determinable
- ✅ Enforceable period must be specified

### Step 2: Identify Performance Obligations
- ✅ Must have at least one performance obligation
- ✅ Distinct goods/services should have standalone selling prices
- ✅ Over-time obligations require control transfer indicators
- ✅ License classification (functional vs symbolic)
- ✅ Principal vs agent analysis
- ✅ Warranty classification (assurance vs service)

### Step 3: Determine Transaction Price
- ✅ Variable consideration constraint validation
- ✅ Significant financing component analysis
- ✅ Upfront fee treatment
- ✅ Material rights valuation

### Step 4: Allocate Transaction Price
- ✅ Allocation weights must sum to 1.0
- ✅ Standalone selling price requirements
- ✅ Residual approach eligibility
- ✅ Discount allocation methodology

### Step 5: Recognize Revenue
- ✅ Recognition method consistency with satisfaction timing
- ✅ Progress metric requirements for over-time recognition
- ✅ License revenue recognition patterns
- ✅ Principal vs agent revenue measurement

## Output Components

### Price Allocation Plan
```typescript
{
  contractId: string;
  totalTransactionPrice: number;
  allocationMethod: 'STANDALONE_PRICE' | 'RESIDUAL' | 'COST_PLUS_MARGIN';
  allocations: PriceAllocationItem[];
  discountAllocation?: number;
}
```

### Revenue Schedules
```typescript
{
  contractId: string;
  performanceObligationId: string;
  totalAllocatedAmount: number;
  recognitionMethod: RevenueRecognitionMethod;
  schedule: RevenueScheduleItem[];
  completionDate?: string;
}
```

### Contract Balances
```typescript
{
  contractId: string;
  asOfDate: string;
  contractAsset: number;
  contractLiability: number;
  refundLiability: number;
  totalContractValue: number;
  recognizedToDate: number;
  remainingToRecognize: number;
}
```

### Accounting Entries
```typescript
{
  date: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  entryType: 'REVENUE_RECOGNITION' | 'CONTRACT_ASSET' | 'CONTRACT_LIABILITY';
}
```

## Examples

See the `examples/` directory for complete policy configurations:

- **Software License Contract** (`software-license-policy.yaml`)
- **Construction Contract** (`construction-contract-policy.json`)
- **SaaS Subscription** (`saas-subscription-policy.yaml`)
- **Telecom Bundle** (`telecom-bundle-policy.json`)

## Testing

```bash
npm test -- packages/domain/src/policy-engine
```

The test suite covers:
- ✅ All 5 IFRS 15 validation steps
- ✅ Price allocation calculations
- ✅ Revenue schedule generation
- ✅ Contract balance calculations
- ✅ Accounting entry generation
- ✅ Contract modification scenarios
- ✅ Edge cases and error handling

## Architecture

```
policy-engine/
├── types.ts           # Zod schemas and TypeScript types
├── validators.ts      # IFRS 15 5-step validation logic
├── calculators.ts     # Price allocation and revenue calculations
├── engine.ts          # Main policy engine orchestration
├── examples/          # Sample policy configurations
├── __tests__/         # Comprehensive test suite
└── README.md         # This documentation
```

## Integration

The Policy Engine integrates with:

- **Prisma Schema** - Contract and performance obligation entities
- **Domain Services** - Revenue recognition and contract management
- **API Controllers** - REST endpoints for policy processing
- **Frontend Components** - Policy configuration and results display

## Performance

- **Processing Time** - Typically < 100ms per contract
- **Memory Usage** - Optimized for large contract portfolios
- **Batch Processing** - Support for processing multiple contracts
- **Caching** - Results cached for repeated calculations

## Compliance

- ✅ **IFRS 15** - Full compliance with all 5 steps
- ✅ **ASC 606** - Compatible with US GAAP equivalent
- ✅ **Audit Trail** - Complete validation and calculation logs
- ✅ **Multi-tenant** - Tenant isolation and data security

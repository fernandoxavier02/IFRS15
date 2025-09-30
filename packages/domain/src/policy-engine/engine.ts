import { IFRS15Validator } from './validators';
import { 
  PriceAllocationCalculator, 
  RevenueScheduleCalculator, 
  ContractBalanceCalculator,
  AccountingEntryGenerator 
} from './calculators';
import {
  ContractPolicy,
  PolicyEngineOutput,
  ContractPolicySchema
} from './types';

// ============================================================================
// IFRS 15 POLICY ENGINE - MAIN ENGINE
// ============================================================================

export class IFRS15PolicyEngine {
  private validator: IFRS15Validator;
  private priceAllocationCalculator: PriceAllocationCalculator;
  private revenueScheduleCalculator: RevenueScheduleCalculator;
  private contractBalanceCalculator: ContractBalanceCalculator;
  private accountingEntryGenerator: AccountingEntryGenerator;

  constructor() {
    this.validator = new IFRS15Validator();
    this.priceAllocationCalculator = new PriceAllocationCalculator();
    this.revenueScheduleCalculator = new RevenueScheduleCalculator();
    this.contractBalanceCalculator = new ContractBalanceCalculator();
    this.accountingEntryGenerator = new AccountingEntryGenerator();
  }

  /**
   * Main processing method - validates policy and generates all outputs
   */
  public async processContract(
    policyData: unknown,
    contractStartDate: Date,
    contractEndDate: Date,
    options: {
      asOfDate?: Date;
      billedToDate?: number;
      costsIncurred?: number;
      generateAccountingEntries?: boolean;
    } = {}
  ): Promise<PolicyEngineOutput> {
    const startTime = Date.now();

    // Validate and parse policy data
    const policy = this.validateAndParsePolicy(policyData);

    // Set default options
    const asOfDate = options.asOfDate || new Date();
    const billedToDate = options.billedToDate || 0;
    const costsIncurred = options.costsIncurred || 0;
    const generateAccountingEntries = options.generateAccountingEntries ?? true;

    // Step 1: Validate contract against IFRS 15 requirements
    const validation = this.validator.validateContract(policy);

    // Step 2: Calculate price allocation
    const priceAllocation = this.priceAllocationCalculator.calculatePriceAllocation(policy);

    // Step 3: Generate revenue schedules for each performance obligation
    const revenueSchedules = policy.performanceObligations.map(po => {
      const allocation = priceAllocation.allocations.find(a => a.performanceObligationId === po.id);
      const allocatedAmount = allocation?.allocatedAmount || 0;

      return this.revenueScheduleCalculator.calculateRevenueSchedule(
        po,
        allocatedAmount,
        contractStartDate,
        contractEndDate,
        policy
      );
    });

    // Step 4: Calculate contract balances
    const contractBalances = this.contractBalanceCalculator.calculateContractBalance(
      policy,
      priceAllocation,
      revenueSchedules,
      asOfDate,
      billedToDate,
      costsIncurred
    );

    // Step 5: Generate accounting entries (if requested)
    const suggestedEntries = generateAccountingEntries
      ? this.accountingEntryGenerator.generateAccountingEntries(
          policy,
          revenueSchedules,
          contractBalances,
          contractStartDate,
          asOfDate
        )
      : [];

    const processingTime = Date.now() - startTime;

    return {
      contractId: policy.contractId,
      generatedAt: new Date().toISOString(),
      validation,
      priceAllocation,
      revenueSchedules,
      contractBalances,
      suggestedEntries,
      metadata: {
        policyVersion: policy.policyVersion,
        engineVersion: '1.0.0',
        processingTimeMs: processingTime
      }
    };
  }

  /**
   * Validates contract modification scenarios
   */
  public validateContractModification(
    originalPolicyData: unknown,
    modifiedPolicyData: unknown
  ): {
    originalValidation: ReturnType<IFRS15Validator['validateContract']>;
    modifiedValidation: ReturnType<IFRS15Validator['validateContract']>;
    modificationValidation: ReturnType<IFRS15Validator['validateContractModification']>;
  } {
    const originalPolicy = this.validateAndParsePolicy(originalPolicyData);
    const modifiedPolicy = this.validateAndParsePolicy(modifiedPolicyData);

    return {
      originalValidation: this.validator.validateContract(originalPolicy),
      modifiedValidation: this.validator.validateContract(modifiedPolicy),
      modificationValidation: this.validator.validateContractModification(originalPolicy, modifiedPolicy)
    };
  }

  /**
   * Processes multiple contracts in batch
   */
  public async processBatch(
    contracts: Array<{
      policyData: unknown;
      contractStartDate: Date;
      contractEndDate: Date;
      options?: Parameters<IFRS15PolicyEngine['processContract']>[3];
    }>
  ): Promise<PolicyEngineOutput[]> {
    const results: PolicyEngineOutput[] = [];

    for (const contract of contracts) {
      try {
        const result = await this.processContract(
          contract.policyData,
          contract.contractStartDate,
          contract.contractEndDate,
          contract.options
        );
        results.push(result);
      } catch (error) {
        // In a real implementation, you might want to handle errors differently
        console.error(`Error processing contract: ${error}`);
        // Could push error result or skip
      }
    }

    return results;
  }

  /**
   * Validates and parses policy data using Zod schema
   */
  private validateAndParsePolicy(policyData: unknown): ContractPolicy {
    try {
      return ContractPolicySchema.parse(policyData);
    } catch (error) {
      throw new Error(`Invalid policy data: ${error}`);
    }
  }

  /**
   * Gets engine configuration and capabilities
   */
  public getEngineInfo(): {
    version: string;
    supportedMethods: string[];
    supportedMetrics: string[];
    capabilities: string[];
  } {
    return {
      version: '1.0.0',
      supportedMethods: [
        'POINT_IN_TIME',
        'OVER_TIME_INPUT',
        'OVER_TIME_OUTPUT',
        'OVER_TIME_MILESTONE',
        'OVER_TIME_COST_TO_COST',
        'OVER_TIME_UNITS_OF_DELIVERY'
      ],
      supportedMetrics: [
        'COSTS_INCURRED',
        'LABOR_HOURS',
        'UNITS_DELIVERED',
        'TIME_ELAPSED',
        'MILESTONES_ACHIEVED',
        'SURVEYS_OF_WORK'
      ],
      capabilities: [
        'IFRS 15 5-step validation',
        'Price allocation calculation',
        'Revenue schedule generation',
        'Contract balance calculation',
        'Accounting entry generation',
        'Contract modification analysis',
        'Batch processing',
        'Policy validation'
      ]
    };
  }
}

// Factory function for easy instantiation
export function createPolicyEngine(): IFRS15PolicyEngine {
  return new IFRS15PolicyEngine();
}

// Export singleton instance
export const policyEngine = new IFRS15PolicyEngine();

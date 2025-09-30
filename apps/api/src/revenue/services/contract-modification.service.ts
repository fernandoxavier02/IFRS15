import { Injectable, Logger } from '@nestjs/common';
import { TransactionPriceService, TransactionPriceCalculationInput } from './transaction-price.service';
import { PriceAllocationService, PriceAllocationInput } from './price-allocation.service';
import { RevenueScheduleService, PerformanceObligationScheduleInput } from './revenue-schedule.service';

export type ModificationType = 'PROSPECTIVE' | 'RETROSPECTIVE' | 'CUMULATIVE_CATCH_UP';
export type ModificationTreatment = 'SEPARATE_CONTRACT' | 'MODIFICATION_OF_EXISTING';

export interface ContractModificationInput {
  originalContractId: string;
  modificationDate: Date;
  modificationReason: string;
  
  // New or changed performance obligations
  addedPerformanceObligations?: Array<{
    id: string;
    description: string;
    standaloneSellingPrice?: number;
    isDistinct: boolean;
  }>;
  
  removedPerformanceObligationIds?: string[];
  
  modifiedPerformanceObligations?: Array<{
    id: string;
    newDescription?: string;
    newStandaloneSellingPrice?: number;
    scopeChange?: string;
  }>;
  
  // Price changes
  additionalConsideration: number;
  priceReductions?: number;
  
  // Contract terms changes
  newContractEndDate?: Date;
  newPaymentTerms?: string;
  
  // Processing preferences
  preferredTreatment?: ModificationTreatment;
  preferredModificationType?: ModificationType;
}

export interface ModificationAnalysisResult {
  recommendedTreatment: ModificationTreatment;
  recommendedModificationType: ModificationType;
  analysis: {
    distinctGoodsServices: boolean;
    standaloneSellingPriceAvailable: boolean;
    priceReflectsStandalonePrice: boolean;
    separateContractCriteriaMet: boolean;
  };
  reasoning: string[];
}

export interface ContractModificationResult {
  modificationId: string;
  originalContractId: string;
  treatment: ModificationTreatment;
  modificationType: ModificationType;
  
  // Financial impact
  originalTransactionPrice: number;
  newTransactionPrice: number;
  priceAdjustment: number;
  
  // Allocation changes
  originalAllocations: Array<{ poId: string; amount: number }>;
  newAllocations: Array<{ poId: string; amount: number }>;
  allocationAdjustments: Array<{ poId: string; adjustment: number }>;
  
  // Revenue schedule impact
  revenueScheduleAdjustments: Array<{
    performanceObligationId: string;
    cumulativeCatchUpAdjustment: number;
    futurePeriodsAdjustment: number;
    effectiveDate: Date;
  }>;
  
  // Accounting entries
  accountingEntries: Array<{
    date: Date;
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
  }>;
}

@Injectable()
export class ContractModificationService {
  private readonly logger = new Logger(ContractModificationService.name);

  constructor(
    private readonly transactionPriceService: TransactionPriceService,
    private readonly priceAllocationService: PriceAllocationService,
    private readonly revenueScheduleService: RevenueScheduleService
  ) {}

  /**
   * Analyzes contract modification to determine appropriate treatment
   */
  async analyzeModification(input: ContractModificationInput): Promise<ModificationAnalysisResult> {
    this.logger.log(`Analyzing contract modification for contract ${input.originalContractId}`);

    const analysis = {
      distinctGoodsServices: this.assessDistinctGoodsServices(input),
      standaloneSellingPriceAvailable: this.assessStandaloneSellingPriceAvailability(input),
      priceReflectsStandalonePrice: this.assessPriceReflectsStandalonePrice(input),
      separateContractCriteriaMet: false
    };

    // Determine if separate contract criteria are met
    analysis.separateContractCriteriaMet = 
      analysis.distinctGoodsServices && 
      analysis.standaloneSellingPriceAvailable && 
      analysis.priceReflectsStandalonePrice;

    const recommendedTreatment: ModificationTreatment = 
      analysis.separateContractCriteriaMet ? 'SEPARATE_CONTRACT' : 'MODIFICATION_OF_EXISTING';

    let recommendedModificationType: ModificationType = 'PROSPECTIVE';
    const reasoning: string[] = [];

    if (recommendedTreatment === 'SEPARATE_CONTRACT') {
      reasoning.push('Modification creates distinct goods/services with observable standalone selling prices');
      reasoning.push('Additional consideration reflects standalone selling prices');
      reasoning.push('Treatment: Account as separate contract');
    } else {
      // Determine modification type for existing contract
      if (this.shouldUseRetrospectiveTreatment(input)) {
        recommendedModificationType = 'RETROSPECTIVE';
        reasoning.push('Modification would have been included in original contract');
        reasoning.push('Treatment: Retrospective adjustment with cumulative catch-up');
      } else if (this.shouldUseCumulativeCatchUp(input)) {
        recommendedModificationType = 'CUMULATIVE_CATCH_UP';
        reasoning.push('Modification affects remaining performance obligations');
        reasoning.push('Treatment: Cumulative catch-up adjustment');
      } else {
        recommendedModificationType = 'PROSPECTIVE';
        reasoning.push('Modification creates new performance obligations or terms');
        reasoning.push('Treatment: Prospective adjustment');
      }
    }

    return {
      recommendedTreatment,
      recommendedModificationType,
      analysis,
      reasoning
    };
  }

  /**
   * Processes contract modification and calculates financial impact
   */
  async processModification(input: ContractModificationInput): Promise<ContractModificationResult> {
    this.logger.log(`Processing contract modification for contract ${input.originalContractId}`);

    // Step 1: Analyze modification
    const analysisResult = await this.analyzeModification(input);
    
    const treatment = input.preferredTreatment || analysisResult.recommendedTreatment;
    const modificationType = input.preferredModificationType || analysisResult.recommendedModificationType;

    // Step 2: Calculate new transaction price
    const newTransactionPrice = await this.calculateModifiedTransactionPrice(input);
    
    // Step 3: Reallocate transaction price
    const allocationResult = await this.reallocateTransactionPrice(input, newTransactionPrice);
    
    // Step 4: Calculate revenue schedule adjustments
    const scheduleAdjustments = await this.calculateScheduleAdjustments(
      input, 
      allocationResult, 
      modificationType
    );
    
    // Step 5: Generate accounting entries
    const accountingEntries = this.generateAccountingEntries(
      input, 
      allocationResult, 
      scheduleAdjustments, 
      modificationType
    );

    return {
      modificationId: `MOD-${input.originalContractId}-${Date.now()}`,
      originalContractId: input.originalContractId,
      treatment,
      modificationType,
      originalTransactionPrice: 0, // Would be fetched from original contract
      newTransactionPrice,
      priceAdjustment: input.additionalConsideration - (input.priceReductions || 0),
      originalAllocations: [], // Would be fetched from original contract
      newAllocations: allocationResult.allocations.map(a => ({
        poId: a.performanceObligationId,
        amount: a.allocatedAmount
      })),
      allocationAdjustments: allocationResult.allocations.map(a => ({
        poId: a.performanceObligationId,
        adjustment: a.allocatedAmount // Simplified - would calculate actual adjustment
      })),
      revenueScheduleAdjustments: scheduleAdjustments,
      accountingEntries
    };
  }

  /**
   * Calculates modified transaction price
   */
  private async calculateModifiedTransactionPrice(input: ContractModificationInput): Promise<number> {
    const transactionPriceInput: TransactionPriceCalculationInput = {
      baseTransactionPrice: input.additionalConsideration,
      contractModifications: {
        additionalConsideration: input.additionalConsideration,
        modificationType: input.preferredModificationType || 'PROSPECTIVE'
      }
    };

    if (input.priceReductions) {
      transactionPriceInput.baseTransactionPrice -= input.priceReductions;
    }

    const result = await this.transactionPriceService.calculateAdjustedTransactionPrice(transactionPriceInput);
    return result.adjustedTransactionPrice;
  }

  /**
   * Reallocates transaction price after modification
   */
  private async reallocateTransactionPrice(
    input: ContractModificationInput, 
    newTransactionPrice: number
  ) {
    // Build performance obligations list including modifications
    const performanceObligations: Array<{
      id: string;
      description: string;
      standaloneSellingPrice?: number;
      isDistinct: boolean;
      estimatedCost?: number;
      marginPercentage?: number;
    }> = [];

    // Add new performance obligations
    if (input.addedPerformanceObligations) {
      performanceObligations.push(...input.addedPerformanceObligations.map(po => ({
        id: po.id,
        description: po.description,
        standaloneSellingPrice: po.standaloneSellingPrice,
        isDistinct: po.isDistinct
      })));
    }

    // Add modified performance obligations
    if (input.modifiedPerformanceObligations) {
      performanceObligations.push(...input.modifiedPerformanceObligations.map(po => ({
        id: po.id,
        description: po.newDescription || `Modified PO ${po.id}`,
        standaloneSellingPrice: po.newStandaloneSellingPrice,
        isDistinct: true // Assume distinct for modifications
      })));
    }

    const allocationInput: PriceAllocationInput = {
      contractId: input.originalContractId,
      adjustedTransactionPrice: newTransactionPrice,
      performanceObligations,
      allocationMethod: 'AUTO',
      discountAllocation: 'PROPORTIONAL'
    };

    return await this.priceAllocationService.allocateTransactionPrice(allocationInput);
  }

  /**
   * Calculates revenue schedule adjustments
   */
  private async calculateScheduleAdjustments(
    input: ContractModificationInput,
    allocationResult: any,
    modificationType: ModificationType
  ): Promise<Array<{
    performanceObligationId: string;
    cumulativeCatchUpAdjustment: number;
    futurePeriodsAdjustment: number;
    effectiveDate: Date;
  }>> {
    const adjustments: Array<{
      performanceObligationId: string;
      cumulativeCatchUpAdjustment: number;
      futurePeriodsAdjustment: number;
      effectiveDate: Date;
    }> = [];

    for (const allocation of allocationResult.allocations) {
      let cumulativeCatchUpAdjustment = 0;
      let futurePeriodsAdjustment = 0;

      switch (modificationType) {
        case 'RETROSPECTIVE':
          // All adjustment goes to cumulative catch-up
          cumulativeCatchUpAdjustment = allocation.allocatedAmount;
          break;

        case 'CUMULATIVE_CATCH_UP':
          // Split between catch-up and future periods
          cumulativeCatchUpAdjustment = allocation.allocatedAmount * 0.5; // Simplified
          futurePeriodsAdjustment = allocation.allocatedAmount * 0.5;
          break;

        case 'PROSPECTIVE':
          // All adjustment goes to future periods
          futurePeriodsAdjustment = allocation.allocatedAmount;
          break;
      }

      adjustments.push({
        performanceObligationId: allocation.performanceObligationId,
        cumulativeCatchUpAdjustment,
        futurePeriodsAdjustment,
        effectiveDate: input.modificationDate
      });
    }

    return adjustments;
  }

  /**
   * Generates accounting entries for the modification
   */
  private generateAccountingEntries(
    input: ContractModificationInput,
    allocationResult: any,
    scheduleAdjustments: any[],
    modificationType: ModificationType
  ): Array<{
    date: Date;
    description: string;
    debitAccount: string;
    creditAccount: string;
    amount: number;
  }> {
    const entries: Array<{
      date: Date;
      description: string;
      debitAccount: string;
      creditAccount: string;
      amount: number;
    }> = [];

    // Contract asset/liability adjustments
    if (input.additionalConsideration > 0) {
      entries.push({
        date: input.modificationDate,
        description: `Contract modification - additional consideration`,
        debitAccount: 'Contract Asset',
        creditAccount: 'Deferred Revenue',
        amount: input.additionalConsideration
      });
    }

    // Revenue adjustments based on modification type
    for (const adjustment of scheduleAdjustments) {
      if (adjustment.cumulativeCatchUpAdjustment !== 0) {
        entries.push({
          date: input.modificationDate,
          description: `Cumulative catch-up adjustment - PO ${adjustment.performanceObligationId}`,
          debitAccount: adjustment.cumulativeCatchUpAdjustment > 0 ? 'Deferred Revenue' : 'Revenue',
          creditAccount: adjustment.cumulativeCatchUpAdjustment > 0 ? 'Revenue' : 'Deferred Revenue',
          amount: Math.abs(adjustment.cumulativeCatchUpAdjustment)
        });
      }
    }

    return entries;
  }

  /**
   * Assesses if modification involves distinct goods or services
   */
  private assessDistinctGoodsServices(input: ContractModificationInput): boolean {
    // Simplified logic - in practice, would analyze the nature of added/modified POs
    return (input.addedPerformanceObligations?.length || 0) > 0;
  }

  /**
   * Assesses if standalone selling prices are available
   */
  private assessStandaloneSellingPriceAvailability(input: ContractModificationInput): boolean {
    if (!input.addedPerformanceObligations) return false;
    
    return input.addedPerformanceObligations.every(po => po.standaloneSellingPrice !== undefined);
  }

  /**
   * Assesses if additional consideration reflects standalone selling prices
   */
  private assessPriceReflectsStandalonePrice(input: ContractModificationInput): boolean {
    if (!input.addedPerformanceObligations) return false;
    
    const totalSSP = input.addedPerformanceObligations.reduce(
      (sum, po) => sum + (po.standaloneSellingPrice || 0), 
      0
    );
    
    const priceVariance = Math.abs(input.additionalConsideration - totalSSP) / totalSSP;
    return priceVariance <= 0.1; // 10% tolerance
  }

  /**
   * Determines if retrospective treatment should be used
   */
  private shouldUseRetrospectiveTreatment(input: ContractModificationInput): boolean {
    // Simplified logic - would consider factors like:
    // - Nature of the modification
    // - Whether it would have been included in original contract
    // - Regulatory requirements
    return input.modificationReason.toLowerCase().includes('scope clarification');
  }

  /**
   * Determines if cumulative catch-up treatment should be used
   */
  private shouldUseCumulativeCatchUp(input: ContractModificationInput): boolean {
    // Simplified logic - would consider factors like:
    // - Remaining performance obligations
    // - Progress to date
    // - Nature of modification
    return (input.modifiedPerformanceObligations?.length || 0) > 0;
  }

  /**
   * Validates modification input
   */
  validateModificationInput(input: ContractModificationInput): string[] {
    const errors: string[] = [];

    if (!input.originalContractId) {
      errors.push('Original contract ID is required');
    }

    if (!input.modificationDate) {
      errors.push('Modification date is required');
    }

    if (!input.modificationReason) {
      errors.push('Modification reason is required');
    }

    if (input.additionalConsideration === 0 && 
        !input.addedPerformanceObligations?.length && 
        !input.modifiedPerformanceObligations?.length &&
        !input.removedPerformanceObligationIds?.length) {
      errors.push('Modification must include changes to consideration, performance obligations, or contract terms');
    }

    if (input.newContractEndDate && input.newContractEndDate <= input.modificationDate) {
      errors.push('New contract end date must be after modification date');
    }

    return errors;
  }
}

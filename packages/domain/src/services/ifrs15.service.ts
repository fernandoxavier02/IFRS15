import { ContractEntity, PerformanceObligationEntity, RevenueRecognitionEntity } from '../entities';
import { SatisfactionMethod, RevenueRecognitionStatus } from '@ifrs15/shared';

export class IFRS15Service {
  // Step 1: Identify the contract with the customer
  validateContractCriteria(contract: ContractEntity): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Commercial substance
    if (contract.totalValue <= 0) {
      errors.push('Contract must have commercial substance (positive value)');
    }

    // Parties have approved the contract
    if (contract.status === 'draft') {
      errors.push('Contract must be approved by all parties');
    }

    // Payment terms are identifiable
    if (!contract.startDate) {
      errors.push('Contract must have identifiable payment terms (start date required)');
    }

    // It is probable that consideration will be collected
    // This would typically involve credit checks, but for now we assume it's valid

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Step 2: Identify performance obligations
  identifyPerformanceObligations(contract: ContractEntity): PerformanceObligationEntity[] {
    return contract.performanceObligations.filter(po => {
      // A performance obligation is distinct if:
      // 1. Customer can benefit from the good/service on its own or together with other readily available resources
      // 2. The promise to transfer the good/service is separately identifiable from other promises
      return po.isDistinct;
    });
  }

  // Step 3: Determine the transaction price
  determineTransactionPrice(contract: ContractEntity): number {
    // For simplicity, we're using the contract total value
    // In practice, this would consider:
    // - Variable consideration
    // - Constraining estimates of variable consideration
    // - Significant financing component
    // - Non-cash consideration
    // - Consideration payable to customer
    return contract.totalValue;
  }

  // Step 4: Allocate transaction price to performance obligations
  allocateTransactionPrice(contract: ContractEntity): void {
    const distinctObligations = this.identifyPerformanceObligations(contract);
    const transactionPrice = this.determineTransactionPrice(contract);

    // Calculate total standalone selling prices
    const totalStandalonePrice = distinctObligations.reduce(
      (sum, po) => sum + po.standaloneSellingPrice,
      0
    );

    if (totalStandalonePrice === 0) {
      // If standalone selling prices are not available, use residual approach
      // or estimate based on expected cost plus margin
      const equalAllocation = transactionPrice / distinctObligations.length;
      distinctObligations.forEach(po => {
        po.allocatedAmount = equalAllocation;
      });
    } else {
      // Allocate based on relative standalone selling prices
      distinctObligations.forEach(po => {
        const allocationRatio = po.standaloneSellingPrice / totalStandalonePrice;
        po.allocatedAmount = transactionPrice * allocationRatio;
      });
    }
  }

  // Step 5: Recognize revenue when performance obligations are satisfied
  calculateRevenueRecognition(
    performanceObligation: PerformanceObligationEntity,
    progressData?: {
      actualCosts: number;
      estimatedTotalCosts: number;
      completionPercentage?: number;
    }
  ): number {
    if (performanceObligation.satisfactionMethod === SatisfactionMethod.POINT_IN_TIME) {
      // Revenue is recognized at the point in time when control transfers
      return performanceObligation.isSatisfied() ? 0 : performanceObligation.allocatedAmount;
    } else {
      // Revenue is recognized over time based on progress
      let progressPercentage = 0;

      if (progressData?.completionPercentage !== undefined) {
        progressPercentage = progressData.completionPercentage;
      } else if (progressData?.actualCosts && progressData?.estimatedTotalCosts) {
        progressPercentage = performanceObligation.calculateProgressPercentage(
          progressData.actualCosts,
          progressData.estimatedTotalCosts
        );
      }

      return performanceObligation.calculateRevenueToRecognize(progressPercentage);
    }
  }

  // Generate revenue recognition entries for a period
  generateRevenueRecognitionEntries(
    contract: ContractEntity,
    period: string,
    progressData?: Map<string, { actualCosts: number; estimatedTotalCosts: number }>
  ): RevenueRecognitionEntity[] {
    const entries: RevenueRecognitionEntity[] = [];
    const distinctObligations = this.identifyPerformanceObligations(contract);

    distinctObligations.forEach(po => {
      const progress = progressData?.get(po.id);
      const revenueAmount = this.calculateRevenueRecognition(po, progress);

      if (revenueAmount > 0) {
        const entry = new RevenueRecognitionEntity(
          crypto.randomUUID(),
          contract.tenantId,
          contract.id,
          po.id,
          revenueAmount,
          new Date(),
          period,
          `Revenue recognition for ${po.description}`,
          RevenueRecognitionStatus.PENDING
        );

        entries.push(entry);
      }
    });

    return entries;
  }

  // Validate revenue recognition according to IFRS 15
  validateRevenueRecognition(
    contract: ContractEntity,
    revenueEntry: RevenueRecognitionEntity
  ): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Find the related performance obligation
    const po = contract.performanceObligations.find(
      p => p.id === revenueEntry.performanceObligationId
    );

    if (!po) {
      errors.push('Performance obligation not found');
      return { isValid: false, errors };
    }

    // Check if revenue amount exceeds remaining allocation
    const remainingAmount = po.allocatedAmount - po.recognizedAmount;
    if (revenueEntry.amount > remainingAmount) {
      errors.push('Revenue amount exceeds remaining allocation');
    }

    // Validate contract criteria
    const contractValidation = this.validateContractCriteria(contract);
    if (!contractValidation.isValid) {
      errors.push(...contractValidation.errors);
    }

    // Validate revenue entry
    const entryValidation = revenueEntry.validate();
    if (!entryValidation.isValid) {
      errors.push(...entryValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  // Calculate contract liability (deferred revenue)
  calculateContractLiability(contract: ContractEntity): number {
    const totalReceived = contract.totalValue; // Assuming full payment received
    const totalRecognized = contract.performanceObligations.reduce(
      (sum, po) => sum + po.recognizedAmount,
      0
    );

    return Math.max(0, totalReceived - totalRecognized);
  }

  // Calculate contract asset (unbilled revenue)
  calculateContractAsset(contract: ContractEntity): number {
    const totalRecognized = contract.performanceObligations.reduce(
      (sum, po) => sum + po.recognizedAmount,
      0
    );
    const totalBilled = 0; // This would come from billing/invoicing system

    return Math.max(0, totalRecognized - totalBilled);
  }
}

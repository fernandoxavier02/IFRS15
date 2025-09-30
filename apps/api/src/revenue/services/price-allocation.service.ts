import { Injectable, Logger } from '@nestjs/common';

export interface PerformanceObligationInput {
  id: string;
  description: string;
  standaloneSellingPrice?: number;
  isDistinct: boolean;
  estimatedCost?: number;
  marginPercentage?: number;
}

export interface PriceAllocationInput {
  contractId: string;
  adjustedTransactionPrice: number;
  performanceObligations: PerformanceObligationInput[];
  allocationMethod?: 'STANDALONE_PRICE' | 'RESIDUAL' | 'COST_PLUS_MARGIN' | 'AUTO';
  discountAllocation?: 'PROPORTIONAL' | 'SPECIFIC_PO' | 'NONE';
  specificDiscountPO?: string;
}

export interface AllocationResult {
  performanceObligationId: string;
  standaloneSellingPrice: number;
  allocatedAmount: number;
  allocationPercentage: number;
  allocationBasis: 'STANDALONE_PRICE' | 'RESIDUAL' | 'ESTIMATED' | 'COST_PLUS_MARGIN';
  adjustments: {
    discountAdjustment: number;
    roundingAdjustment: number;
  };
}

export interface PriceAllocationResult {
  contractId: string;
  totalTransactionPrice: number;
  totalStandaloneSellingPrice: number;
  totalDiscount: number;
  allocationMethod: string;
  allocations: AllocationResult[];
  validation: {
    totalAllocated: number;
    allocationVariance: number;
    isValid: boolean;
    warnings: string[];
  };
}

@Injectable()
export class PriceAllocationService {
  private readonly logger = new Logger(PriceAllocationService.name);

  /**
   * Allocates transaction price across performance obligations based on SSP
   */
  async allocateTransactionPrice(input: PriceAllocationInput): Promise<PriceAllocationResult> {
    this.logger.log(`Allocating transaction price for contract ${input.contractId}: ${input.adjustedTransactionPrice}`);

    // Step 1: Determine allocation method
    const allocationMethod = this.determineAllocationMethod(input);

    // Step 2: Calculate or estimate standalone selling prices
    const sspData = await this.calculateStandaloneSellingPrices(input);

    // Step 3: Perform allocation based on method
    const allocations = this.performAllocation(input, sspData, allocationMethod);

    // Step 4: Apply discount allocation
    this.applyDiscountAllocation(allocations, input);

    // Step 5: Apply rounding adjustments
    this.applyRoundingAdjustments(allocations, input.adjustedTransactionPrice);

    // Step 6: Validate results
    const validation = this.validateAllocation(allocations, input.adjustedTransactionPrice);

    return {
      contractId: input.contractId,
      totalTransactionPrice: input.adjustedTransactionPrice,
      totalStandaloneSellingPrice: sspData.totalSSP,
      totalDiscount: Math.max(0, sspData.totalSSP - input.adjustedTransactionPrice),
      allocationMethod,
      allocations,
      validation
    };
  }

  /**
   * Determines the appropriate allocation method
   */
  private determineAllocationMethod(input: PriceAllocationInput): string {
    if (input.allocationMethod && input.allocationMethod !== 'AUTO') {
      return input.allocationMethod;
    }

    const obligationsWithSSP = input.performanceObligations.filter(po => po.standaloneSellingPrice);
    const obligationsWithoutSSP = input.performanceObligations.filter(po => !po.standaloneSellingPrice);

    // Residual approach: Only one PO without SSP and others have observable SSP
    if (obligationsWithoutSSP.length === 1 && obligationsWithSSP.length > 0) {
      return 'RESIDUAL';
    }

    // Standalone price approach: All POs have observable SSP
    if (obligationsWithoutSSP.length === 0) {
      return 'STANDALONE_PRICE';
    }

    // Cost plus margin: Multiple POs without SSP
    return 'COST_PLUS_MARGIN';
  }

  /**
   * Calculates or estimates standalone selling prices
   */
  private async calculateStandaloneSellingPrices(
    input: PriceAllocationInput
  ): Promise<{ sspData: Array<{ poId: string; ssp: number; basis: string }>; totalSSP: number }> {
    const sspData: Array<{ poId: string; ssp: number; basis: string }> = [];
    let totalSSP = 0;

    for (const po of input.performanceObligations) {
      let ssp: number;
      let basis: string;

      if (po.standaloneSellingPrice) {
        ssp = po.standaloneSellingPrice;
        basis = 'OBSERVABLE';
      } else {
        // Estimate SSP using cost plus margin approach
        ssp = this.estimateSSP(po, input);
        basis = 'ESTIMATED';
      }

      sspData.push({ poId: po.id, ssp, basis });
      totalSSP += ssp;
    }

    return { sspData, totalSSP };
  }

  /**
   * Estimates SSP using cost plus margin or other methods
   */
  private estimateSSP(po: PerformanceObligationInput, input: PriceAllocationInput): number {
    // Cost plus margin approach
    if (po.estimatedCost && po.marginPercentage) {
      return po.estimatedCost * (1 + po.marginPercentage);
    }

    // Residual approach for single remaining PO
    const obligationsWithSSP = input.performanceObligations.filter(p => p.standaloneSellingPrice && p.id !== po.id);
    const obligationsWithoutSSP = input.performanceObligations.filter(p => !p.standaloneSellingPrice);

    if (obligationsWithoutSSP.length === 1 && obligationsWithSSP.length > 0) {
      const totalKnownSSP = obligationsWithSSP.reduce((sum, p) => sum + (p.standaloneSellingPrice || 0), 0);
      return Math.max(0, input.adjustedTransactionPrice - totalKnownSSP);
    }

    // Default: Equal allocation of remaining amount
    const remainingObligations = input.performanceObligations.filter(p => !p.standaloneSellingPrice).length;
    return remainingObligations > 0 ? input.adjustedTransactionPrice / remainingObligations * 0.1 : 0;
  }

  /**
   * Performs the actual allocation based on the determined method
   */
  private performAllocation(
    input: PriceAllocationInput,
    sspData: { sspData: Array<{ poId: string; ssp: number; basis: string }>; totalSSP: number },
    method: string
  ): AllocationResult[] {
    const allocations: AllocationResult[] = [];

    for (const po of input.performanceObligations) {
      const sspInfo = sspData.sspData.find(s => s.poId === po.id)!;
      let allocatedAmount: number;
      let allocationBasis: AllocationResult['allocationBasis'];

      switch (method) {
        case 'STANDALONE_PRICE':
          const proportion = sspData.totalSSP > 0 ? sspInfo.ssp / sspData.totalSSP : 0;
          allocatedAmount = input.adjustedTransactionPrice * proportion;
          allocationBasis = 'STANDALONE_PRICE';
          break;

        case 'RESIDUAL':
          if (po.standaloneSellingPrice) {
            const proportion = sspData.totalSSP > 0 ? sspInfo.ssp / sspData.totalSSP : 0;
            allocatedAmount = input.adjustedTransactionPrice * proportion;
            allocationBasis = 'STANDALONE_PRICE';
          } else {
            // This is the residual PO
            const otherAllocations = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
            allocatedAmount = Math.max(0, input.adjustedTransactionPrice - otherAllocations);
            allocationBasis = 'RESIDUAL';
          }
          break;

        case 'COST_PLUS_MARGIN':
          const proportion2 = sspData.totalSSP > 0 ? sspInfo.ssp / sspData.totalSSP : 0;
          allocatedAmount = input.adjustedTransactionPrice * proportion2;
          allocationBasis = sspInfo.basis === 'OBSERVABLE' ? 'STANDALONE_PRICE' : 'COST_PLUS_MARGIN';
          break;

        default:
          allocatedAmount = 0;
          allocationBasis = 'ESTIMATED';
      }

      const allocationPercentage = input.adjustedTransactionPrice > 0 ? allocatedAmount / input.adjustedTransactionPrice : 0;

      allocations.push({
        performanceObligationId: po.id,
        standaloneSellingPrice: sspInfo.ssp,
        allocatedAmount,
        allocationPercentage,
        allocationBasis,
        adjustments: {
          discountAdjustment: 0,
          roundingAdjustment: 0
        }
      });
    }

    return allocations;
  }

  /**
   * Applies discount allocation across performance obligations
   */
  private applyDiscountAllocation(allocations: AllocationResult[], input: PriceAllocationInput): void {
    const totalSSP = allocations.reduce((sum, a) => sum + a.standaloneSellingPrice, 0);
    const totalDiscount = totalSSP - input.adjustedTransactionPrice;

    if (totalDiscount <= 0) {
      return; // No discount to allocate
    }

    switch (input.discountAllocation) {
      case 'PROPORTIONAL':
        // Allocate discount proportionally based on SSP
        for (const allocation of allocations) {
          const discountProportion = totalSSP > 0 ? allocation.standaloneSellingPrice / totalSSP : 0;
          const discountAmount = totalDiscount * discountProportion;
          allocation.adjustments.discountAdjustment = -discountAmount;
          allocation.allocatedAmount -= discountAmount;
        }
        break;

      case 'SPECIFIC_PO':
        // Allocate entire discount to specific PO
        if (input.specificDiscountPO) {
          const targetAllocation = allocations.find(a => a.performanceObligationId === input.specificDiscountPO);
          if (targetAllocation) {
            targetAllocation.adjustments.discountAdjustment = -totalDiscount;
            targetAllocation.allocatedAmount -= totalDiscount;
          }
        }
        break;

      case 'NONE':
      default:
        // No specific discount allocation
        break;
    }
  }

  /**
   * Applies rounding adjustments to ensure total equals transaction price
   */
  private applyRoundingAdjustments(allocations: AllocationResult[], targetTotal: number): void {
    const currentTotal = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const variance = targetTotal - currentTotal;

    if (Math.abs(variance) < 0.01) {
      return; // No significant variance
    }

    // Apply adjustment to the largest allocation
    const largestAllocation = allocations.reduce((max, current) => 
      current.allocatedAmount > max.allocatedAmount ? current : max
    );

    largestAllocation.adjustments.roundingAdjustment = variance;
    largestAllocation.allocatedAmount += variance;
    largestAllocation.allocationPercentage = largestAllocation.allocatedAmount / targetTotal;
  }

  /**
   * Validates the allocation results
   */
  private validateAllocation(allocations: AllocationResult[], targetTotal: number): {
    totalAllocated: number;
    allocationVariance: number;
    isValid: boolean;
    warnings: string[];
  } {
    const totalAllocated = allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
    const allocationVariance = Math.abs(targetTotal - totalAllocated);
    const warnings: string[] = [];

    // Check for negative allocations
    const negativeAllocations = allocations.filter(a => a.allocatedAmount < 0);
    if (negativeAllocations.length > 0) {
      warnings.push(`${negativeAllocations.length} performance obligations have negative allocations`);
    }

    // Check for zero allocations
    const zeroAllocations = allocations.filter(a => a.allocatedAmount === 0);
    if (zeroAllocations.length > 0) {
      warnings.push(`${zeroAllocations.length} performance obligations have zero allocations`);
    }

    // Check allocation variance
    if (allocationVariance > 0.01) {
      warnings.push(`Allocation variance of ${allocationVariance.toFixed(2)} exceeds tolerance`);
    }

    return {
      totalAllocated,
      allocationVariance,
      isValid: warnings.length === 0 && allocationVariance <= 0.01,
      warnings
    };
  }

  /**
   * Validates allocation input
   */
  validateAllocationInput(input: PriceAllocationInput): string[] {
    const errors: string[] = [];

    if (input.adjustedTransactionPrice <= 0) {
      errors.push('Adjusted transaction price must be greater than zero');
    }

    if (!input.performanceObligations || input.performanceObligations.length === 0) {
      errors.push('At least one performance obligation is required');
    }

    // Check for duplicate PO IDs
    const poIds = input.performanceObligations.map(po => po.id);
    const uniqueIds = new Set(poIds);
    if (poIds.length !== uniqueIds.size) {
      errors.push('Performance obligation IDs must be unique');
    }

    // Validate specific discount PO
    if (input.discountAllocation === 'SPECIFIC_PO' && input.specificDiscountPO) {
      const exists = input.performanceObligations.some(po => po.id === input.specificDiscountPO);
      if (!exists) {
        errors.push('Specific discount PO ID does not exist in performance obligations');
      }
    }

    return errors;
  }
}

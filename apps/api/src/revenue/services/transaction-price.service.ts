import { Injectable, Logger } from '@nestjs/common';

export type VariableConsiderationConstraint = 
  | 'MOST_LIKELY_AMOUNT'
  | 'EXPECTED_VALUE'
  | 'CONSTRAINED_ESTIMATE'
  | 'UNCONSTRAINED_ESTIMATE';

export interface TransactionPriceCalculationInput {
  baseTransactionPrice: number;
  variableConsideration?: {
    estimatedAmount: number;
    constraint: VariableConsiderationConstraint;
    constraintThreshold: number;
    probabilityAssessment?: number;
  };
  financingComponent?: {
    hasSignificantFinancing: boolean;
    effectiveInterestRate?: number;
    paymentTermsMonths?: number;
    presentValueAdjustment?: number;
  };
  upfrontFees?: {
    amount: number;
    treatmentMethod: 'CAPITALIZE' | 'EXPENSE' | 'ALLOCATE';
  };
  contractModifications?: {
    additionalConsideration: number;
    modificationType: 'PROSPECTIVE' | 'RETROSPECTIVE' | 'CUMULATIVE_CATCH_UP';
  };
}

export interface TransactionPriceCalculationResult {
  adjustedTransactionPrice: number;
  adjustments: {
    variableConsiderationAdjustment: number;
    financingComponentAdjustment: number;
    upfrontFeeAdjustment: number;
    modificationAdjustment: number;
  };
  constraintAnalysis: {
    unconstrainedAmount: number;
    constrainedAmount: number;
    constraintApplied: boolean;
    constraintReason?: string;
  };
  breakdown: {
    baseAmount: number;
    variableAmount: number;
    financingAdjustment: number;
    finalAmount: number;
  };
}

@Injectable()
export class TransactionPriceService {
  private readonly logger = new Logger(TransactionPriceService.name);

  /**
   * Calculates adjusted transaction price including variable consideration constraints
   */
  async calculateAdjustedTransactionPrice(
    input: TransactionPriceCalculationInput
  ): Promise<TransactionPriceCalculationResult> {
    this.logger.log(`Calculating adjusted transaction price for base amount: ${input.baseTransactionPrice}`);

    let adjustedPrice = input.baseTransactionPrice;
    const adjustments = {
      variableConsiderationAdjustment: 0,
      financingComponentAdjustment: 0,
      upfrontFeeAdjustment: 0,
      modificationAdjustment: 0
    };

    // Step 1: Apply variable consideration constraint
    const constraintResult = this.applyVariableConsiderationConstraint(input);
    adjustedPrice += constraintResult.constrainedAmount;
    adjustments.variableConsiderationAdjustment = constraintResult.constrainedAmount;

    // Step 2: Apply financing component adjustment
    const financingAdjustment = this.calculateFinancingAdjustment(input);
    adjustedPrice += financingAdjustment;
    adjustments.financingComponentAdjustment = financingAdjustment;

    // Step 3: Handle upfront fees
    const upfrontAdjustment = this.calculateUpfrontFeeAdjustment(input);
    adjustedPrice += upfrontAdjustment;
    adjustments.upfrontFeeAdjustment = upfrontAdjustment;

    // Step 4: Apply contract modifications
    const modificationAdjustment = this.calculateModificationAdjustment(input);
    adjustedPrice += modificationAdjustment;
    adjustments.modificationAdjustment = modificationAdjustment;

    return {
      adjustedTransactionPrice: Math.max(0, adjustedPrice),
      adjustments,
      constraintAnalysis: {
        unconstrainedAmount: input.variableConsideration?.estimatedAmount || 0,
        constrainedAmount: constraintResult.constrainedAmount,
        constraintApplied: constraintResult.constraintApplied,
        constraintReason: constraintResult.constraintReason
      },
      breakdown: {
        baseAmount: input.baseTransactionPrice,
        variableAmount: constraintResult.constrainedAmount,
        financingAdjustment: financingAdjustment,
        finalAmount: adjustedPrice
      }
    };
  }

  /**
   * Applies variable consideration constraint based on IFRS 15 requirements
   */
  private applyVariableConsiderationConstraint(
    input: TransactionPriceCalculationInput
  ): { constrainedAmount: number; constraintApplied: boolean; constraintReason?: string } {
    if (!input.variableConsideration) {
      return { constrainedAmount: 0, constraintApplied: false };
    }

    const { estimatedAmount, constraint, constraintThreshold, probabilityAssessment } = input.variableConsideration;

    switch (constraint) {
      case 'MOST_LIKELY_AMOUNT':
        // Use the single most likely amount
        return {
          constrainedAmount: estimatedAmount,
          constraintApplied: false,
          constraintReason: 'Most likely amount method applied'
        };

      case 'EXPECTED_VALUE':
        // Probability-weighted expected value
        const probability = probabilityAssessment || 0.5;
        return {
          constrainedAmount: estimatedAmount * probability,
          constraintApplied: true,
          constraintReason: `Expected value method with ${probability * 100}% probability`
        };

      case 'CONSTRAINED_ESTIMATE':
        // Apply constraint to limit reversal risk
        const constraintFactor = 1 - constraintThreshold;
        const constrainedAmount = estimatedAmount * constraintFactor;
        return {
          constrainedAmount,
          constraintApplied: true,
          constraintReason: `Constraint applied to limit reversal risk (${constraintThreshold * 100}% threshold)`
        };

      case 'UNCONSTRAINED_ESTIMATE':
        // No constraint applied
        return {
          constrainedAmount: estimatedAmount,
          constraintApplied: false,
          constraintReason: 'No constraint applied - unconstrained estimate'
        };

      default:
        return { constrainedAmount: 0, constraintApplied: false };
    }
  }

  /**
   * Calculates financing component adjustment
   */
  private calculateFinancingAdjustment(input: TransactionPriceCalculationInput): number {
    if (!input.financingComponent?.hasSignificantFinancing) {
      return 0;
    }

    const { effectiveInterestRate, paymentTermsMonths, presentValueAdjustment } = input.financingComponent;

    // If present value adjustment is provided, use it
    if (presentValueAdjustment !== undefined) {
      return presentValueAdjustment;
    }

    // Calculate present value adjustment based on payment terms
    if (effectiveInterestRate && paymentTermsMonths) {
      const monthlyRate = effectiveInterestRate / 12;
      const periods = paymentTermsMonths;
      const presentValueFactor = 1 / Math.pow(1 + monthlyRate, periods);
      
      // Adjustment is the difference between nominal and present value
      return input.baseTransactionPrice * (presentValueFactor - 1);
    }

    return 0;
  }

  /**
   * Calculates upfront fee adjustment
   */
  private calculateUpfrontFeeAdjustment(input: TransactionPriceCalculationInput): number {
    if (!input.upfrontFees) {
      return 0;
    }

    const { amount, treatmentMethod } = input.upfrontFees;

    switch (treatmentMethod) {
      case 'ALLOCATE':
        // Include in transaction price for allocation
        return amount;
      
      case 'CAPITALIZE':
      case 'EXPENSE':
        // Don't include in transaction price
        return 0;
      
      default:
        return 0;
    }
  }

  /**
   * Calculates contract modification adjustment
   */
  private calculateModificationAdjustment(input: TransactionPriceCalculationInput): number {
    if (!input.contractModifications) {
      return 0;
    }

    const { additionalConsideration, modificationType } = input.contractModifications;

    switch (modificationType) {
      case 'PROSPECTIVE':
      case 'CUMULATIVE_CATCH_UP':
        // Add to current transaction price
        return additionalConsideration;
      
      case 'RETROSPECTIVE':
        // Handled separately in reprocessing
        return additionalConsideration;
      
      default:
        return 0;
    }
  }

  /**
   * Validates transaction price calculation inputs
   */
  validateCalculationInput(input: TransactionPriceCalculationInput): string[] {
    const errors: string[] = [];

    if (input.baseTransactionPrice <= 0) {
      errors.push('Base transaction price must be greater than zero');
    }

    if (input.variableConsideration) {
      if (input.variableConsideration.constraintThreshold < 0 || input.variableConsideration.constraintThreshold > 1) {
        errors.push('Constraint threshold must be between 0 and 1');
      }
    }

    if (input.financingComponent?.hasSignificantFinancing) {
      if (!input.financingComponent.effectiveInterestRate && !input.financingComponent.presentValueAdjustment) {
        errors.push('Significant financing component requires effective interest rate or present value adjustment');
      }
    }

    return errors;
  }
}

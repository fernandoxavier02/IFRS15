import { ContractEntity, PerformanceObligationEntity } from '../entities';
import { ContractStatus, SatisfactionMethod } from '@ifrs15/shared';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class ContractValidationService {
  // Comprehensive contract validation
  validateContract(contract: ContractEntity): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic contract validation
    const basicValidation = this.validateBasicContractData(contract);
    errors.push(...basicValidation.errors);
    warnings.push(...basicValidation.warnings);

    // Performance obligations validation
    const poValidation = this.validatePerformanceObligations(contract);
    errors.push(...poValidation.errors);
    warnings.push(...poValidation.warnings);

    // Financial validation
    const financialValidation = this.validateFinancialData(contract);
    errors.push(...financialValidation.errors);
    warnings.push(...financialValidation.warnings);

    // IFRS 15 compliance validation
    const ifrsValidation = this.validateIFRS15Compliance(contract);
    errors.push(...ifrsValidation.errors);
    warnings.push(...ifrsValidation.warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  private validateBasicContractData(contract: ContractEntity): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!contract.customerId) {
      errors.push('Customer ID is required');
    }

    if (!contract.contractNumber || contract.contractNumber.trim() === '') {
      errors.push('Contract number is required');
    }

    if (!contract.title || contract.title.trim() === '') {
      errors.push('Contract title is required');
    }

    if (!contract.startDate) {
      errors.push('Start date is required');
    }

    if (!contract.currency || contract.currency.length !== 3) {
      errors.push('Valid currency code (3 characters) is required');
    }

    // Date validations
    if (contract.startDate && contract.endDate) {
      if (contract.startDate >= contract.endDate) {
        errors.push('End date must be after start date');
      }
    }

    // Status validation
    if (!Object.values(ContractStatus).includes(contract.status)) {
      errors.push('Invalid contract status');
    }

    // Warnings
    if (contract.endDate && contract.endDate < new Date()) {
      warnings.push('Contract end date is in the past');
    }

    if (!contract.description || contract.description.trim() === '') {
      warnings.push('Contract description is recommended');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validatePerformanceObligations(contract: ContractEntity): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (contract.performanceObligations.length === 0) {
      errors.push('Contract must have at least one performance obligation');
      return { isValid: false, errors, warnings };
    }

    // Validate each performance obligation
    contract.performanceObligations.forEach((po, index) => {
      const poValidation = this.validatePerformanceObligation(po, index);
      errors.push(...poValidation.errors);
      warnings.push(...poValidation.warnings);
    });

    // Check for distinct performance obligations
    const distinctObligations = contract.performanceObligations.filter(po => po.isDistinct);
    if (distinctObligations.length === 0) {
      errors.push('Contract must have at least one distinct performance obligation');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validatePerformanceObligation(
    po: PerformanceObligationEntity,
    index: number
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const prefix = `Performance Obligation ${index + 1}:`;

    if (!po.description || po.description.trim() === '') {
      errors.push(`${prefix} Description is required`);
    }

    if (po.allocatedAmount < 0) {
      errors.push(`${prefix} Allocated amount cannot be negative`);
    }

    if (po.recognizedAmount < 0) {
      errors.push(`${prefix} Recognized amount cannot be negative`);
    }

    if (po.recognizedAmount > po.allocatedAmount) {
      errors.push(`${prefix} Recognized amount cannot exceed allocated amount`);
    }

    if (!Object.values(SatisfactionMethod).includes(po.satisfactionMethod)) {
      errors.push(`${prefix} Invalid satisfaction method`);
    }

    // Warnings
    if (po.allocatedAmount === 0) {
      warnings.push(`${prefix} Allocated amount is zero`);
    }

    if (po.satisfactionMethod === SatisfactionMethod.OVER_TIME && !po.estimatedCompletionDate) {
      warnings.push(`${prefix} Estimated completion date recommended for over-time satisfaction`);
    }

    if (po.estimatedCompletionDate && po.estimatedCompletionDate < new Date()) {
      warnings.push(`${prefix} Estimated completion date is in the past`);
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateFinancialData(contract: ContractEntity): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (contract.totalValue <= 0) {
      errors.push('Contract total value must be positive');
    }

    // Check allocation consistency
    const totalAllocated = contract.performanceObligations.reduce(
      (sum, po) => sum + po.allocatedAmount,
      0
    );

    const tolerance = 0.01; // Allow for small rounding differences
    if (Math.abs(totalAllocated - contract.totalValue) > tolerance) {
      errors.push(
        `Total allocated amount (${totalAllocated}) must equal contract total value (${contract.totalValue})`
      );
    }

    // Check recognition consistency
    const totalRecognized = contract.performanceObligations.reduce(
      (sum, po) => sum + po.recognizedAmount,
      0
    );

    if (totalRecognized > contract.totalValue) {
      errors.push('Total recognized revenue cannot exceed contract total value');
    }

    // Warnings
    if (totalRecognized === 0 && contract.status === ContractStatus.ACTIVE) {
      warnings.push('No revenue has been recognized for an active contract');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  private validateIFRS15Compliance(contract: ContractEntity): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Step 1: Contract with customer validation
    if (contract.status === ContractStatus.DRAFT) {
      warnings.push('Contract is still in draft status - ensure all parties have approved');
    }

    // Step 2: Performance obligations identification
    const distinctObligations = contract.performanceObligations.filter(po => po.isDistinct);
    if (distinctObligations.length !== contract.performanceObligations.length) {
      warnings.push('Some performance obligations are not marked as distinct - review bundling criteria');
    }

    // Step 3: Transaction price determination
    if (contract.totalValue !== contract.totalValue) {
      warnings.push('Consider variable consideration, financing components, and other adjustments');
    }

    // Step 4: Allocation validation
    const hasStandaloneSellingPrices = contract.performanceObligations.some(
      po => po.standaloneSellingPrice > 0
    );
    if (!hasStandaloneSellingPrices) {
      warnings.push('Standalone selling prices not set - allocation may not be optimal');
    }

    // Step 5: Revenue recognition timing
    contract.performanceObligations.forEach((po, index) => {
      if (po.satisfactionMethod === SatisfactionMethod.OVER_TIME) {
        if (!po.estimatedCompletionDate) {
          warnings.push(
            `Performance Obligation ${index + 1}: Consider setting completion date for over-time recognition`
          );
        }
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  // Validate contract modification
  validateContractModification(
    originalContract: ContractEntity,
    modifiedContract: ContractEntity
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation of modified contract
    const basicValidation = this.validateContract(modifiedContract);
    errors.push(...basicValidation.errors);
    warnings.push(...basicValidation.warnings);

    // Modification-specific validations
    if (originalContract.totalValue !== modifiedContract.totalValue) {
      warnings.push('Contract value has changed - ensure proper modification accounting');
    }

    if (originalContract.performanceObligations.length !== modifiedContract.performanceObligations.length) {
      warnings.push('Number of performance obligations has changed - review modification treatment');
    }

    // Check for recognized revenue impact
    const originalRecognized = originalContract.performanceObligations.reduce(
      (sum, po) => sum + po.recognizedAmount,
      0
    );

    if (originalRecognized > 0) {
      warnings.push('Contract has recognized revenue - modification may require catch-up adjustment');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }
}

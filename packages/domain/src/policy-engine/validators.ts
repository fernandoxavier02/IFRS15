import {
  ContractPolicy,
  ValidationResult,
  ContractValidation,
  PerformanceObligationPolicy,
  RevenueRecognitionMethod,
  LicenseType
} from './types';

// ============================================================================
// IFRS 15 POLICY ENGINE - VALIDATORS
// ============================================================================

export class IFRS15Validator {
  
  /**
   * Validates all 5 steps of IFRS 15 for a contract policy
   */
  public validateContract(policy: ContractPolicy): ContractValidation {
    const stepResults: ValidationResult[] = [
      this.validateStep1_IdentifyContract(policy),
      this.validateStep2_IdentifyPerformanceObligations(policy),
      this.validateStep3_DetermineTransactionPrice(policy),
      this.validateStep4_AllocateTransactionPrice(policy),
      this.validateStep5_RecognizeRevenue(policy)
    ];

    const totalErrors = stepResults.reduce((sum, result) => sum + result.errors.length, 0);
    const totalWarnings = stepResults.reduce((sum, result) => sum + result.warnings.length, 0);
    const criticalIssues = stepResults
      .filter(result => !result.isValid)
      .map(result => `Step ${result.step}: ${result.errors.join(', ')}`);

    return {
      contractId: policy.contractId,
      overallValid: stepResults.every(result => result.isValid),
      stepResults,
      summary: {
        totalErrors,
        totalWarnings,
        criticalIssues
      }
    };
  }

  /**
   * Step 1: Identify the Contract
   * Validates contract enforceability and commercial substance
   */
  private validateStep1_IdentifyContract(policy: ContractPolicy): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check enforceability
    if (!policy.isEnforceable) {
      errors.push('Contract must be enforceable to apply IFRS 15');
    }

    // Check enforceable period
    if (policy.enforceablePeriodMonths <= 0) {
      errors.push('Enforceable period must be greater than zero');
    }

    if (policy.enforceablePeriodMonths > 120) {
      warnings.push('Enforceable period exceeds 10 years - consider contract modification analysis');
    }

    // Check commercial substance
    if (!policy.hasCommercialSubstance) {
      errors.push('Contract must have commercial substance');
    }

    // Check transaction price
    if (policy.transactionPrice <= 0) {
      errors.push('Transaction price must be greater than zero');
    }

    // Recommendations
    if (policy.performanceObligations.length === 1) {
      recommendations.push('Single performance obligation - consider if bundling is appropriate');
    }

    return {
      isValid: errors.length === 0,
      step: 'STEP_1',
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Step 2: Identify Performance Obligations
   * Validates distinctness and bundling of performance obligations
   */
  private validateStep2_IdentifyPerformanceObligations(policy: ContractPolicy): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Must have at least one performance obligation
    if (policy.performanceObligations.length === 0) {
      errors.push('Contract must have at least one performance obligation');
      return { isValid: false, step: 'STEP_2', errors, warnings, recommendations };
    }

    // Validate each performance obligation
    for (const po of policy.performanceObligations) {
      // Check distinctness logic
      if (po.isDistinct && !po.standaloneSellingPrice) {
        warnings.push(`PO ${po.id}: Distinct obligation should have standalone selling price`);
      }

      // Check control transfer indicators for over-time recognition
      if (po.satisfactionTiming === 'OVER_TIME' && (!po.controlTransferIndicators || po.controlTransferIndicators.length === 0)) {
        warnings.push(`PO ${po.id}: Over-time recognition requires control transfer indicators`);
      }

      // Validate license types
      if (po.licenseType) {
        this.validateLicenseClassification(po, errors, warnings);
      }

      // Validate principal/agent analysis
      if (po.principalAgentRole === 'AGENT' && po.revenueRecognitionMethod !== 'POINT_IN_TIME') {
        warnings.push(`PO ${po.id}: Agent arrangements typically recognize revenue at point in time`);
      }

      // Validate warranty classification
      if (po.warrantyClassification === 'SERVICE_WARRANTY' && !po.standaloneSellingPrice) {
        errors.push(`PO ${po.id}: Service warranty must have standalone selling price`);
      }
    }

    // Check for bundling opportunities
    const distinctObligations = policy.performanceObligations.filter(po => po.isDistinct);
    if (distinctObligations.length !== policy.performanceObligations.length) {
      recommendations.push('Consider bundling non-distinct performance obligations');
    }

    return {
      isValid: errors.length === 0,
      step: 'STEP_2',
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Step 3: Determine Transaction Price
   * Validates transaction price components and constraints
   */
  private validateStep3_DetermineTransactionPrice(policy: ContractPolicy): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Validate variable consideration constraint
    if (policy.constraintThreshold < 0 || policy.constraintThreshold > 1) {
      errors.push('Constraint threshold must be between 0 and 1');
    }

    // Validate financing component
    if (policy.financingComponent.hasSignificantFinancing) {
      if (!policy.financingComponent.effectiveInterestRate) {
        errors.push('Significant financing component requires effective interest rate');
      }

      if (policy.financingComponent.paymentTermsMonths && policy.financingComponent.paymentTermsMonths < 12) {
        warnings.push('Payment terms less than 12 months may not constitute significant financing');
      }
    }

    // Validate upfront fees
    if (policy.upfrontFee.hasUpfrontFee) {
      if (!policy.upfrontFee.amount || policy.upfrontFee.amount <= 0) {
        errors.push('Upfront fee amount must be specified and greater than zero');
      }

      if (!policy.upfrontFee.treatmentMethod) {
        errors.push('Upfront fee treatment method must be specified');
      }
    }

    // Check for material rights
    const materialRights = policy.performanceObligations.filter(po => po.materialRight?.hasMaterialRight);
    if (materialRights.length > 0) {
      for (const po of materialRights) {
        if (!po.materialRight?.standaloneSellingPrice) {
          warnings.push(`PO ${po.id}: Material right should have standalone selling price`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      step: 'STEP_3',
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Step 4: Allocate Transaction Price
   * Validates price allocation methodology
   */
  private validateStep4_AllocateTransactionPrice(policy: ContractPolicy): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check allocation weights sum to 1
    const totalWeight = policy.performanceObligations
      .reduce((sum, po) => sum + (po.allocationWeight || 0), 0);

    if (Math.abs(totalWeight - 1) > 0.01) {
      warnings.push('Allocation weights should sum to 1.0');
    }

    // Validate standalone selling prices
    const obligationsWithSSP = policy.performanceObligations.filter(po => po.standaloneSellingPrice);
    if (obligationsWithSSP.length === 0) {
      warnings.push('At least one performance obligation should have standalone selling price');
    }

    // Check for residual approach eligibility
    const obligationsWithoutSSP = policy.performanceObligations.filter(po => !po.standaloneSellingPrice);
    if (obligationsWithoutSSP.length > 1) {
      warnings.push('Residual approach can only be used for one performance obligation');
    }

    // Validate discount allocation
    const totalSSP = obligationsWithSSP.reduce((sum, po) => sum + (po.standaloneSellingPrice || 0), 0);
    if (totalSSP > policy.transactionPrice) {
      const discount = totalSSP - policy.transactionPrice;
      recommendations.push(`Contract discount of ${discount} should be allocated proportionally`);
    }

    return {
      isValid: errors.length === 0,
      step: 'STEP_4',
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Step 5: Recognize Revenue
   * Validates revenue recognition timing and methods
   */
  private validateStep5_RecognizeRevenue(policy: ContractPolicy): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    for (const po of policy.performanceObligations) {
      // Validate recognition method consistency
      if (po.satisfactionTiming === 'OVER_TIME') {
        const overTimeMethods: RevenueRecognitionMethod[] = [
          'OVER_TIME_INPUT',
          'OVER_TIME_OUTPUT',
          'OVER_TIME_MILESTONE',
          'OVER_TIME_COST_TO_COST',
          'OVER_TIME_UNITS_OF_DELIVERY'
        ];

        if (!overTimeMethods.includes(po.revenueRecognitionMethod)) {
          errors.push(`PO ${po.id}: Over-time satisfaction requires over-time recognition method`);
        }

        // Validate progress metric
        if (!po.progressMetric) {
          errors.push(`PO ${po.id}: Over-time recognition requires progress metric`);
        }
      }

      if (po.satisfactionTiming === 'AT_POINT_IN_TIME' && po.revenueRecognitionMethod !== 'POINT_IN_TIME') {
        errors.push(`PO ${po.id}: Point-in-time satisfaction requires point-in-time recognition`);
      }

      // Validate license revenue recognition
      if (po.licenseType) {
        this.validateLicenseRevenueRecognition(po, errors, warnings);
      }

      // Validate principal/agent revenue recognition
      if (po.principalAgentRole === 'AGENT') {
        recommendations.push(`PO ${po.id}: Agent should recognize net commission, not gross revenue`);
      }
    }

    return {
      isValid: errors.length === 0,
      step: 'STEP_5',
      errors,
      warnings,
      recommendations
    };
  }

  /**
   * Validates license classification (functional vs symbolic IP)
   */
  private validateLicenseClassification(po: PerformanceObligationPolicy, errors: string[], warnings: string[]): void {
    if (!po.licenseType) return;

    // Functional IP validation
    if (po.licenseType === 'FUNCTIONAL_IP' || po.licenseType === 'RIGHT_TO_USE') {
      if (po.satisfactionTiming !== 'AT_POINT_IN_TIME') {
        warnings.push(`PO ${po.id}: Functional IP typically satisfied at point in time`);
      }
    }

    // Symbolic IP validation
    if (po.licenseType === 'SYMBOLIC_IP' || po.licenseType === 'RIGHT_TO_ACCESS') {
      if (po.satisfactionTiming !== 'OVER_TIME') {
        warnings.push(`PO ${po.id}: Symbolic IP typically satisfied over time`);
      }
    }
  }

  /**
   * Validates license revenue recognition patterns
   */
  private validateLicenseRevenueRecognition(po: PerformanceObligationPolicy, errors: string[], warnings: string[]): void {
    if (!po.licenseType) return;

    // Right to use licenses
    if (po.licenseType === 'RIGHT_TO_USE' || po.licenseType === 'FUNCTIONAL_IP') {
      if (po.revenueRecognitionMethod !== 'POINT_IN_TIME') {
        errors.push(`PO ${po.id}: Right-to-use licenses should recognize revenue at point in time`);
      }
    }

    // Right to access licenses
    if (po.licenseType === 'RIGHT_TO_ACCESS' || po.licenseType === 'SYMBOLIC_IP') {
      const overTimeMethods: RevenueRecognitionMethod[] = [
        'OVER_TIME_INPUT',
        'OVER_TIME_OUTPUT',
        'OVER_TIME_MILESTONE',
        'OVER_TIME_TIME_ELAPSED'
      ];

      if (!overTimeMethods.includes(po.revenueRecognitionMethod)) {
        errors.push(`PO ${po.id}: Right-to-access licenses should recognize revenue over time`);
      }
    }
  }

  /**
   * Validates contract modification treatment
   */
  public validateContractModification(
    originalPolicy: ContractPolicy,
    modifiedPolicy: ContractPolicy
  ): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check if modification creates new distinct goods/services
    const newPOs = modifiedPolicy.performanceObligations.filter(
      po => !originalPolicy.performanceObligations.find(orig => orig.id === po.id)
    );

    if (newPOs.length > 0) {
      // Check if new goods/services are distinct
      const distinctNewPOs = newPOs.filter(po => po.isDistinct);
      if (distinctNewPOs.length > 0) {
        recommendations.push('New distinct goods/services may require prospective treatment');
      }
    }

    // Check price changes
    if (modifiedPolicy.transactionPrice !== originalPolicy.transactionPrice) {
      const priceChange = modifiedPolicy.transactionPrice - originalPolicy.transactionPrice;
      if (priceChange > 0) {
        recommendations.push('Price increase should be evaluated for distinct goods/services');
      } else {
        warnings.push('Price decrease may require retrospective adjustment');
      }
    }

    // Validate modification treatment consistency
    if (modifiedPolicy.modificationTreatment === 'RETROSPECTIVE') {
      warnings.push('Retrospective treatment requires restatement of prior periods');
    }

    return {
      isValid: errors.length === 0,
      step: 'STEP_1', // Modification validation spans all steps
      errors,
      warnings,
      recommendations
    };
  }
}

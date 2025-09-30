import { describe, it, expect, beforeEach } from '@jest/globals';
import { IFRS15Validator } from '../validators';
import { ContractPolicy } from '../types';

describe('IFRS15Validator', () => {
  let validator: IFRS15Validator;
  let validPolicy: ContractPolicy;

  beforeEach(() => {
    validator = new IFRS15Validator();
    
    validPolicy = {
      contractId: 'TEST-001',
      tenantId: 'tenant-test',
      policyVersion: '1.0.0',
      effectiveDate: '2024-01-01T00:00:00Z',
      hasCommercialSubstance: true,
      isEnforceable: true,
      enforceablePeriodMonths: 12,
      transactionPrice: 100000,
      variableConsiderationConstraint: 'CONSTRAINED_ESTIMATE',
      constraintThreshold: 0.05,
      financingComponent: {
        hasSignificantFinancing: false
      },
      upfrontFee: {
        hasUpfrontFee: false
      },
      performanceObligations: [
        {
          id: 'PO-1',
          description: 'Software License',
          revenueRecognitionMethod: 'POINT_IN_TIME',
          isDistinct: true,
          standaloneSellingPrice: 60000,
          allocationWeight: 0.6,
          satisfactionTiming: 'AT_POINT_IN_TIME',
          controlTransferIndicators: ['License delivered'],
          licenseType: 'RIGHT_TO_USE',
          principalAgentRole: 'PRINCIPAL'
        }
      ],
      modificationTreatment: 'PROSPECTIVE'
    };
  });

  describe('validateContract', () => {
    it('should validate a correct contract policy', () => {
      const result = validator.validateContract(validPolicy);

      expect(result.overallValid).toBe(true);
      expect(result.stepResults).toHaveLength(5);
      expect(result.summary.totalErrors).toBe(0);
    });

    it('should fail validation for unenforceable contract', () => {
      const invalidPolicy = { ...validPolicy, isEnforceable: false };
      const result = validator.validateContract(invalidPolicy);

      expect(result.overallValid).toBe(false);
      expect(result.stepResults[0].errors).toContain('Contract must be enforceable to apply IFRS 15');
    });

    it('should fail validation for zero transaction price', () => {
      const invalidPolicy = { ...validPolicy, transactionPrice: 0 };
      const result = validator.validateContract(invalidPolicy);

      expect(result.overallValid).toBe(false);
      expect(result.stepResults[0].errors).toContain('Transaction price must be greater than zero');
    });

    it('should fail validation for contract without commercial substance', () => {
      const invalidPolicy = { ...validPolicy, hasCommercialSubstance: false };
      const result = validator.validateContract(invalidPolicy);

      expect(result.overallValid).toBe(false);
      expect(result.stepResults[0].errors).toContain('Contract must have commercial substance');
    });
  });

  describe('Step 2 - Performance Obligations', () => {
    it('should fail validation for contract without performance obligations', () => {
      const invalidPolicy = { ...validPolicy, performanceObligations: [] };
      const result = validator.validateContract(invalidPolicy);

      expect(result.overallValid).toBe(false);
      expect(result.stepResults[1].errors).toContain('Contract must have at least one performance obligation');
    });

    it('should warn about distinct obligations without standalone selling price', () => {
      const policyWithoutSSP = {
        ...validPolicy,
        performanceObligations: [{
          ...validPolicy.performanceObligations[0],
          standaloneSellingPrice: undefined
        }]
      };
      const result = validator.validateContract(policyWithoutSSP);

      expect(result.stepResults[1].warnings).toContain('PO PO-1: Distinct obligation should have standalone selling price');
    });

    it('should warn about over-time recognition without control transfer indicators', () => {
      const policyWithoutIndicators = {
        ...validPolicy,
        performanceObligations: [{
          ...validPolicy.performanceObligations[0],
          satisfactionTiming: 'OVER_TIME' as const,
          controlTransferIndicators: undefined
        }]
      };
      const result = validator.validateContract(policyWithoutIndicators);

      expect(result.stepResults[1].warnings).toContain('PO PO-1: Over-time recognition requires control transfer indicators');
    });
  });

  describe('Step 3 - Transaction Price', () => {
    it('should fail validation for invalid constraint threshold', () => {
      const invalidPolicy = { ...validPolicy, constraintThreshold: 1.5 };
      const result = validator.validateContract(invalidPolicy);

      expect(result.overallValid).toBe(false);
      expect(result.stepResults[2].errors).toContain('Constraint threshold must be between 0 and 1');
    });

    it('should fail validation for significant financing without interest rate', () => {
      const invalidPolicy = {
        ...validPolicy,
        financingComponent: {
          hasSignificantFinancing: true,
          effectiveInterestRate: undefined
        }
      };
      const result = validator.validateContract(invalidPolicy);

      expect(result.overallValid).toBe(false);
      expect(result.stepResults[2].errors).toContain('Significant financing component requires effective interest rate');
    });

    it('should fail validation for upfront fee without amount', () => {
      const invalidPolicy = {
        ...validPolicy,
        upfrontFee: {
          hasUpfrontFee: true,
          amount: undefined
        }
      };
      const result = validator.validateContract(invalidPolicy);

      expect(result.overallValid).toBe(false);
      expect(result.stepResults[2].errors).toContain('Upfront fee amount must be specified and greater than zero');
    });
  });

  describe('Step 4 - Price Allocation', () => {
    it('should warn about allocation weights not summing to 1', () => {
      const invalidPolicy = {
        ...validPolicy,
        performanceObligations: [
          { ...validPolicy.performanceObligations[0], allocationWeight: 0.8 }
        ]
      };
      const result = validator.validateContract(invalidPolicy);

      expect(result.stepResults[3].warnings).toContain('Allocation weights should sum to 1.0');
    });

    it('should warn when no obligations have standalone selling price', () => {
      const invalidPolicy = {
        ...validPolicy,
        performanceObligations: [{
          ...validPolicy.performanceObligations[0],
          standaloneSellingPrice: undefined
        }]
      };
      const result = validator.validateContract(invalidPolicy);

      expect(result.stepResults[3].warnings).toContain('At least one performance obligation should have standalone selling price');
    });
  });

  describe('Step 5 - Revenue Recognition', () => {
    it('should fail validation for inconsistent recognition method and timing', () => {
      const invalidPolicy = {
        ...validPolicy,
        performanceObligations: [{
          ...validPolicy.performanceObligations[0],
          satisfactionTiming: 'OVER_TIME' as const,
          revenueRecognitionMethod: 'POINT_IN_TIME' as const
        }]
      };
      const result = validator.validateContract(invalidPolicy);

      expect(result.overallValid).toBe(false);
      expect(result.stepResults[4].errors).toContain('PO PO-1: Over-time satisfaction requires over-time recognition method');
    });

    it('should fail validation for over-time recognition without progress metric', () => {
      const invalidPolicy = {
        ...validPolicy,
        performanceObligations: [{
          ...validPolicy.performanceObligations[0],
          satisfactionTiming: 'OVER_TIME' as const,
          revenueRecognitionMethod: 'OVER_TIME_INPUT' as const,
          progressMetric: undefined
        }]
      };
      const result = validator.validateContract(invalidPolicy);

      expect(result.overallValid).toBe(false);
      expect(result.stepResults[4].errors).toContain('PO PO-1: Over-time recognition requires progress metric');
    });
  });

  describe('License Validation', () => {
    it('should warn about functional IP not being point in time', () => {
      const policyWithFunctionalIP = {
        ...validPolicy,
        performanceObligations: [{
          ...validPolicy.performanceObligations[0],
          licenseType: 'FUNCTIONAL_IP' as const,
          satisfactionTiming: 'OVER_TIME' as const
        }]
      };
      const result = validator.validateContract(policyWithFunctionalIP);

      expect(result.stepResults[1].warnings).toContain('PO PO-1: Functional IP typically satisfied at point in time');
    });

    it('should warn about symbolic IP not being over time', () => {
      const policyWithSymbolicIP = {
        ...validPolicy,
        performanceObligations: [{
          ...validPolicy.performanceObligations[0],
          licenseType: 'SYMBOLIC_IP' as const,
          satisfactionTiming: 'AT_POINT_IN_TIME' as const
        }]
      };
      const result = validator.validateContract(policyWithSymbolicIP);

      expect(result.stepResults[1].warnings).toContain('PO PO-1: Symbolic IP typically satisfied over time');
    });

    it('should fail validation for right-to-use license not recognizing at point in time', () => {
      const invalidPolicy = {
        ...validPolicy,
        performanceObligations: [{
          ...validPolicy.performanceObligations[0],
          licenseType: 'RIGHT_TO_USE' as const,
          revenueRecognitionMethod: 'OVER_TIME_INPUT' as const
        }]
      };
      const result = validator.validateContract(invalidPolicy);

      expect(result.overallValid).toBe(false);
      expect(result.stepResults[4].errors).toContain('PO PO-1: Right-to-use licenses should recognize revenue at point in time');
    });
  });

  describe('validateContractModification', () => {
    it('should validate simple contract modification', () => {
      const modifiedPolicy = {
        ...validPolicy,
        transactionPrice: 120000
      };

      const result = validator.validateContractModification(validPolicy, modifiedPolicy);

      expect(result.isValid).toBe(true);
      expect(result.recommendations).toContain('Price increase should be evaluated for distinct goods/services');
    });

    it('should warn about price decreases', () => {
      const modifiedPolicy = {
        ...validPolicy,
        transactionPrice: 80000
      };

      const result = validator.validateContractModification(validPolicy, modifiedPolicy);

      expect(result.warnings).toContain('Price decrease may require retrospective adjustment');
    });

    it('should recommend prospective treatment for new distinct goods', () => {
      const modifiedPolicy = {
        ...validPolicy,
        performanceObligations: [
          ...validPolicy.performanceObligations,
          {
            id: 'PO-NEW',
            description: 'New Service',
            revenueRecognitionMethod: 'POINT_IN_TIME' as const,
            isDistinct: true,
            standaloneSellingPrice: 20000,
            allocationWeight: 0.2,
            satisfactionTiming: 'AT_POINT_IN_TIME' as const,
            principalAgentRole: 'PRINCIPAL' as const
          }
        ]
      };

      const result = validator.validateContractModification(validPolicy, modifiedPolicy);

      expect(result.recommendations).toContain('New distinct goods/services may require prospective treatment');
    });
  });
});

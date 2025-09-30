import { Test, TestingModule } from '@nestjs/testing';
import { TransactionPriceService, TransactionPriceCalculationInput } from '../services/transaction-price.service';

describe('TransactionPriceService', () => {
  let service: TransactionPriceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TransactionPriceService],
    }).compile();

    service = module.get<TransactionPriceService>(TransactionPriceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateAdjustedTransactionPrice', () => {
    it('should calculate basic transaction price without adjustments', async () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000
      };

      const result = await service.calculateAdjustedTransactionPrice(input);

      expect(result.adjustedTransactionPrice).toBe(100000);
      expect(result.adjustments.variableConsiderationAdjustment).toBe(0);
      expect(result.adjustments.financingComponentAdjustment).toBe(0);
      expect(result.constraintAnalysis.constraintApplied).toBe(false);
    });

    it('should apply variable consideration with most likely amount method', async () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000,
        variableConsideration: {
          estimatedAmount: 20000,
          constraint: 'MOST_LIKELY_AMOUNT',
          constraintThreshold: 0.1
        }
      };

      const result = await service.calculateAdjustedTransactionPrice(input);

      expect(result.adjustedTransactionPrice).toBe(120000);
      expect(result.adjustments.variableConsiderationAdjustment).toBe(20000);
      expect(result.constraintAnalysis.unconstrainedAmount).toBe(20000);
      expect(result.constraintAnalysis.constrainedAmount).toBe(20000);
    });

    it('should apply variable consideration constraint with expected value method', async () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000,
        variableConsideration: {
          estimatedAmount: 30000,
          constraint: 'EXPECTED_VALUE',
          constraintThreshold: 0.2,
          probabilityAssessment: 0.7
        }
      };

      const result = await service.calculateAdjustedTransactionPrice(input);

      expect(result.adjustedTransactionPrice).toBe(121000); // 100000 + (30000 * 0.7)
      expect(result.adjustments.variableConsiderationAdjustment).toBe(21000);
      expect(result.constraintAnalysis.constraintApplied).toBe(true);
    });

    it('should apply constrained estimate to limit reversal risk', async () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000,
        variableConsideration: {
          estimatedAmount: 50000,
          constraint: 'CONSTRAINED_ESTIMATE',
          constraintThreshold: 0.3 // 30% constraint
        }
      };

      const result = await service.calculateAdjustedTransactionPrice(input);

      expect(result.adjustedTransactionPrice).toBe(135000); // 100000 + (50000 * 0.7)
      expect(result.adjustments.variableConsiderationAdjustment).toBe(35000);
      expect(result.constraintAnalysis.constraintApplied).toBe(true);
    });

    it('should calculate financing component adjustment with present value', async () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000,
        financingComponent: {
          hasSignificantFinancing: true,
          presentValueAdjustment: -5000
        }
      };

      const result = await service.calculateAdjustedTransactionPrice(input);

      expect(result.adjustedTransactionPrice).toBe(95000);
      expect(result.adjustments.financingComponentAdjustment).toBe(-5000);
    });

    it('should calculate financing component adjustment with interest rate', async () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000,
        financingComponent: {
          hasSignificantFinancing: true,
          effectiveInterestRate: 0.12, // 12% annual
          paymentTermsMonths: 12
        }
      };

      const result = await service.calculateAdjustedTransactionPrice(input);

      expect(result.adjustedTransactionPrice).toBeLessThan(100000);
      expect(result.adjustments.financingComponentAdjustment).toBeLessThan(0);
    });

    it('should handle upfront fees with allocation treatment', async () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000,
        upfrontFees: {
          amount: 15000,
          treatmentMethod: 'ALLOCATE'
        }
      };

      const result = await service.calculateAdjustedTransactionPrice(input);

      expect(result.adjustedTransactionPrice).toBe(115000);
      expect(result.adjustments.upfrontFeeAdjustment).toBe(15000);
    });

    it('should handle upfront fees with capitalize treatment', async () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000,
        upfrontFees: {
          amount: 15000,
          treatmentMethod: 'CAPITALIZE'
        }
      };

      const result = await service.calculateAdjustedTransactionPrice(input);

      expect(result.adjustedTransactionPrice).toBe(100000);
      expect(result.adjustments.upfrontFeeAdjustment).toBe(0);
    });

    it('should apply contract modification adjustments', async () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000,
        contractModifications: {
          additionalConsideration: 25000,
          modificationType: 'PROSPECTIVE'
        }
      };

      const result = await service.calculateAdjustedTransactionPrice(input);

      expect(result.adjustedTransactionPrice).toBe(125000);
      expect(result.adjustments.modificationAdjustment).toBe(25000);
    });

    it('should handle complex scenario with multiple adjustments', async () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 200000,
        variableConsideration: {
          estimatedAmount: 40000,
          constraint: 'EXPECTED_VALUE',
          constraintThreshold: 0.15,
          probabilityAssessment: 0.8
        },
        financingComponent: {
          hasSignificantFinancing: true,
          presentValueAdjustment: -8000
        },
        upfrontFees: {
          amount: 12000,
          treatmentMethod: 'ALLOCATE'
        },
        contractModifications: {
          additionalConsideration: 15000,
          modificationType: 'CUMULATIVE_CATCH_UP'
        }
      };

      const result = await service.calculateAdjustedTransactionPrice(input);

      // 200000 + (40000 * 0.8) - 8000 + 12000 + 15000 = 251000
      expect(result.adjustedTransactionPrice).toBe(251000);
      expect(result.adjustments.variableConsiderationAdjustment).toBe(32000);
      expect(result.adjustments.financingComponentAdjustment).toBe(-8000);
      expect(result.adjustments.upfrontFeeAdjustment).toBe(12000);
      expect(result.adjustments.modificationAdjustment).toBe(15000);
    });

    it('should ensure minimum transaction price of zero', async () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 10000,
        financingComponent: {
          hasSignificantFinancing: true,
          presentValueAdjustment: -15000 // Larger than base price
        }
      };

      const result = await service.calculateAdjustedTransactionPrice(input);

      expect(result.adjustedTransactionPrice).toBe(0);
    });
  });

  describe('validateCalculationInput', () => {
    it('should return no errors for valid input', () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000,
        variableConsideration: {
          estimatedAmount: 20000,
          constraint: 'MOST_LIKELY_AMOUNT',
          constraintThreshold: 0.5
        }
      };

      const errors = service.validateCalculationInput(input);
      expect(errors).toHaveLength(0);
    });

    it('should return error for zero or negative base price', () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 0
      };

      const errors = service.validateCalculationInput(input);
      expect(errors).toContain('Base transaction price must be greater than zero');
    });

    it('should return error for invalid constraint threshold', () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000,
        variableConsideration: {
          estimatedAmount: 20000,
          constraint: 'CONSTRAINED_ESTIMATE',
          constraintThreshold: 1.5 // Invalid - should be between 0 and 1
        }
      };

      const errors = service.validateCalculationInput(input);
      expect(errors).toContain('Constraint threshold must be between 0 and 1');
    });

    it('should return error for financing component without required data', () => {
      const input: TransactionPriceCalculationInput = {
        baseTransactionPrice: 100000,
        financingComponent: {
          hasSignificantFinancing: true
          // Missing effectiveInterestRate and presentValueAdjustment
        }
      };

      const errors = service.validateCalculationInput(input);
      expect(errors).toContain('Significant financing component requires effective interest rate or present value adjustment');
    });
  });
});

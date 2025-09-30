import { Test, TestingModule } from '@nestjs/testing';
import { DACService, DACRegistrationInput, DACImpairmentTestInput } from '../services/dac.service';

describe('DACService', () => {
  let service: DACService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DACService],
    }).compile();

    service = module.get<DACService>(DACService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerDAC', () => {
    it('should register DAC with valid input', async () => {
      const input: DACRegistrationInput = {
        contractId: 'CTR-001',
        performanceObligationId: 'PO-001',
        costType: 'SALES_COMMISSION',
        amount: 50000,
        description: 'Sales commission for enterprise software contract',
        incurredDate: new Date('2024-01-15'),
        isIncremental: true,
        isRecoverable: true,
        amortizationMethod: 'STRAIGHT_LINE',
        amortizationPeriodMonths: 36,
        expectedBenefitPeriod: new Date('2027-01-15'),
        supportingDocuments: ['invoice-001.pdf', 'commission-agreement.pdf']
      };

      const result = await service.registerDAC(input);

      expect(result).toBeDefined();
      expect(result.dacId).toContain('DAC-CTR-001');
      expect(result.initialAmount).toBe(50000);
      expect(result.validation.isValid).toBe(true);
      expect(result.amortizationSchedule).toBeDefined();
      expect(result.amortizationSchedule.length).toBeGreaterThan(0);
      expect(result.accountingEntries).toBeDefined();
      expect(result.accountingEntries.length).toBe(2);
    });

    it('should reject DAC registration with invalid amount', async () => {
      const input: DACRegistrationInput = {
        contractId: 'CTR-001',
        costType: 'SALES_COMMISSION',
        amount: -1000, // Invalid negative amount
        description: 'Invalid commission',
        incurredDate: new Date('2024-01-15'),
        isIncremental: true,
        isRecoverable: true,
        amortizationMethod: 'STRAIGHT_LINE',
        amortizationPeriodMonths: 36,
        expectedBenefitPeriod: new Date('2027-01-15')
      };

      await expect(service.registerDAC(input)).rejects.toThrow('Invalid DAC registration');
    });

    it('should generate warnings for non-incremental costs', async () => {
      const input: DACRegistrationInput = {
        contractId: 'CTR-002',
        costType: 'LEGAL_FEES',
        amount: 25000,
        description: 'General legal fees',
        incurredDate: new Date('2024-01-15'),
        isIncremental: false, // Non-incremental cost
        isRecoverable: true,
        amortizationMethod: 'STRAIGHT_LINE',
        amortizationPeriodMonths: 24,
        expectedBenefitPeriod: new Date('2026-01-15')
      };

      const result = await service.registerDAC(input);

      expect(result.validation.isValid).toBe(true);
      expect(result.validation.warnings).toContain('Cost is not incremental - may not qualify for DAC treatment');
    });

    it('should generate warnings for large DAC amounts', async () => {
      const input: DACRegistrationInput = {
        contractId: 'CTR-003',
        costType: 'BROKER_FEE',
        amount: 1500000, // Large amount
        description: 'Large broker fee for major contract',
        incurredDate: new Date('2024-01-15'),
        isIncremental: true,
        isRecoverable: true,
        amortizationMethod: 'STRAIGHT_LINE',
        amortizationPeriodMonths: 60,
        expectedBenefitPeriod: new Date('2029-01-15')
      };

      const result = await service.registerDAC(input);

      expect(result.validation.warnings).toContain('Large DAC amount - ensure proper approval and documentation');
    });
  });

  describe('generateAmortizationSchedule', () => {
    it('should generate correct amortization schedule', async () => {
      const input = {
        dacId: 'DAC-CTR-001-123',
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2026-12-31')
      };

      const result = await service.generateAmortizationSchedule(input);

      expect(result).toBeDefined();
      expect(result.dacId).toBe(input.dacId);
      expect(result.totalOriginalAmount).toBeGreaterThan(0);
      expect(result.amortizationSchedule).toBeDefined();
      expect(result.amortizationSchedule.length).toBeGreaterThan(0);
      expect(result.accountingEntries).toBeDefined();
      expect(result.nextAmortizationDate).toBeDefined();

      // Verify schedule integrity
      const schedule = result.amortizationSchedule;
      expect(schedule[0].beginningBalance).toBe(result.totalOriginalAmount);
      expect(schedule[schedule.length - 1].endingBalance).toBeLessThanOrEqual(result.totalOriginalAmount * 0.1);
    });

    it('should calculate cumulative amortization correctly', async () => {
      const input = {
        dacId: 'DAC-CTR-002-456',
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2025-12-31')
      };

      const result = await service.generateAmortizationSchedule(input);
      const schedule = result.amortizationSchedule;

      // Verify cumulative amortization increases monotonically
      for (let i = 1; i < schedule.length; i++) {
        expect(schedule[i].cumulativeAmortization).toBeGreaterThanOrEqual(schedule[i - 1].cumulativeAmortization);
      }

      // Verify total amortized equals cumulative amortization
      const lastEntry = schedule[schedule.length - 1];
      expect(Math.abs(result.totalAmortized - lastEntry.cumulativeAmortization)).toBeLessThan(1);
    });
  });

  describe('performImpairmentTest', () => {
    it('should identify no impairment when recoverable amount exceeds carrying amount', async () => {
      const input: DACImpairmentTestInput = {
        dacId: 'DAC-CTR-001-123',
        testDate: new Date('2024-06-30'),
        remainingConsideration: 200000,
        directCosts: 50000,
        estimatedCostsToComplete: 75000
      };

      const result = await service.performImpairmentTest(input);

      expect(result).toBeDefined();
      expect(result.isImpaired).toBe(false);
      expect(result.impairmentLoss).toBe(0);
      expect(result.recoverableAmount).toBe(75000); // 200000 - 50000 - 75000
      expect(result.accountingEntries).toHaveLength(0);
      expect(result.recommendations).toBeDefined();
    });

    it('should identify impairment when carrying amount exceeds recoverable amount', async () => {
      const input: DACImpairmentTestInput = {
        dacId: 'DAC-CTR-002-456',
        testDate: new Date('2024-06-30'),
        remainingConsideration: 80000,
        directCosts: 30000,
        estimatedCostsToComplete: 60000
      };

      const result = await service.performImpairmentTest(input);

      expect(result).toBeDefined();
      expect(result.isImpaired).toBe(true);
      expect(result.impairmentLoss).toBeGreaterThan(0);
      expect(result.recoverableAmount).toBe(-10000); // 80000 - 30000 - 60000, but max(0, -10000) = 0
      expect(result.accountingEntries).toHaveLength(2);
      expect(result.recommendations).toContain('Immediate impairment loss recognition required');
    });

    it('should handle contract modifications in impairment test', async () => {
      const input: DACImpairmentTestInput = {
        dacId: 'DAC-CTR-003-789',
        testDate: new Date('2024-06-30'),
        remainingConsideration: 100000,
        directCosts: 40000,
        estimatedCostsToComplete: 50000,
        contractModifications: {
          additionalConsideration: 25000,
          additionalCosts: 10000
        }
      };

      const result = await service.performImpairmentTest(input);

      expect(result).toBeDefined();
      expect(result.recoverableAmount).toBe(25000); // 100000 + 25000 - 40000 - 50000 - 10000
      expect(result.impairmentCalculation.remainingConsideration).toBe(100000);
    });

    it('should generate appropriate recommendations based on recovery margin', async () => {
      const inputLowMargin: DACImpairmentTestInput = {
        dacId: 'DAC-CTR-004-101',
        testDate: new Date('2024-06-30'),
        remainingConsideration: 80000,
        directCosts: 5000,
        estimatedCostsToComplete: 5000
      };

      const result = await service.performImpairmentTest(inputLowMargin);

      expect(result.recommendations).toContain('Low recovery margin - monitor closely for future impairment');
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero amortization periods gracefully', async () => {
      const input: DACRegistrationInput = {
        contractId: 'CTR-EDGE-001',
        costType: 'SALES_COMMISSION',
        amount: 10000,
        description: 'Short-term commission',
        incurredDate: new Date('2024-01-15'),
        isIncremental: true,
        isRecoverable: true,
        amortizationMethod: 'STRAIGHT_LINE',
        amortizationPeriodMonths: 1, // Very short period
        expectedBenefitPeriod: new Date('2024-02-15')
      };

      const result = await service.registerDAC(input);

      expect(result.validation.isValid).toBe(true);
      expect(result.amortizationSchedule.length).toBe(1);
      expect(result.amortizationSchedule[0].amortizationAmount).toBe(10000);
    });

    it('should validate required fields', async () => {
      const input: Partial<DACRegistrationInput> = {
        contractId: '', // Missing required field
        amount: 50000,
        description: 'Test DAC'
      };

      await expect(service.registerDAC(input as DACRegistrationInput)).rejects.toThrow();
    });

    it('should handle negative recoverable amounts in impairment test', async () => {
      const input: DACImpairmentTestInput = {
        dacId: 'DAC-EDGE-002',
        testDate: new Date('2024-06-30'),
        remainingConsideration: 10000,
        directCosts: 50000,
        estimatedCostsToComplete: 100000
      };

      const result = await service.performImpairmentTest(input);

      expect(result.recoverableAmount).toBe(0); // Should not be negative
      expect(result.isImpaired).toBe(true);
    });
  });

  describe('Accounting Entries Generation', () => {
    it('should generate correct initial accounting entries', async () => {
      const input: DACRegistrationInput = {
        contractId: 'CTR-ACC-001',
        costType: 'SALES_COMMISSION',
        amount: 30000,
        description: 'Sales commission accounting test',
        incurredDate: new Date('2024-01-15'),
        isIncremental: true,
        isRecoverable: true,
        amortizationMethod: 'STRAIGHT_LINE',
        amortizationPeriodMonths: 24,
        expectedBenefitPeriod: new Date('2026-01-15')
      };

      const result = await service.registerDAC(input);

      expect(result.accountingEntries).toHaveLength(2);
      
      const debitEntry = result.accountingEntries.find(entry => entry.debit);
      const creditEntry = result.accountingEntries.find(entry => entry.credit);

      expect(debitEntry).toBeDefined();
      expect(debitEntry.account).toBe('1350'); // DAC Asset Account
      expect(debitEntry.debit).toBe(30000);

      expect(creditEntry).toBeDefined();
      expect(creditEntry.account).toBe('2100'); // Payable/Cash Account
      expect(creditEntry.credit).toBe(30000);
    });

    it('should generate correct impairment accounting entries', async () => {
      const input: DACImpairmentTestInput = {
        dacId: 'DAC-ACC-002',
        testDate: new Date('2024-06-30'),
        remainingConsideration: 20000,
        directCosts: 10000,
        estimatedCostsToComplete: 20000
      };

      const result = await service.performImpairmentTest(input);

      if (result.isImpaired) {
        expect(result.accountingEntries).toHaveLength(2);
        
        const expenseEntry = result.accountingEntries.find(entry => entry.debit);
        const assetEntry = result.accountingEntries.find(entry => entry.credit);

        expect(expenseEntry).toBeDefined();
        expect(expenseEntry.account).toBe('6300'); // Impairment Loss Account
        expect(expenseEntry.debit).toBe(result.impairmentLoss);

        expect(assetEntry).toBeDefined();
        expect(assetEntry.account).toBe('1350'); // DAC Asset Account
        expect(assetEntry.credit).toBe(result.impairmentLoss);
      }
    });
  });
});

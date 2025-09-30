import { describe, it, expect, beforeEach } from '@jest/globals';
import { 
  PriceAllocationCalculator, 
  RevenueScheduleCalculator, 
  ContractBalanceCalculator,
  AccountingEntryGenerator 
} from '../calculators';
import { ContractPolicy, PriceAllocationPlan, RevenueSchedule } from '../types';

describe('PriceAllocationCalculator', () => {
  let calculator: PriceAllocationCalculator;
  let mockPolicy: ContractPolicy;

  beforeEach(() => {
    calculator = new PriceAllocationCalculator();
    
    mockPolicy = {
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
      financingComponent: { hasSignificantFinancing: false },
      upfrontFee: { hasUpfrontFee: false },
      performanceObligations: [
        {
          id: 'PO-1',
          description: 'Software License',
          revenueRecognitionMethod: 'POINT_IN_TIME',
          isDistinct: true,
          standaloneSellingPrice: 60000,
          allocationWeight: 0.6,
          satisfactionTiming: 'AT_POINT_IN_TIME',
          principalAgentRole: 'PRINCIPAL'
        },
        {
          id: 'PO-2',
          description: 'Support Services',
          revenueRecognitionMethod: 'OVER_TIME_INPUT',
          isDistinct: true,
          standaloneSellingPrice: 40000,
          allocationWeight: 0.4,
          satisfactionTiming: 'OVER_TIME',
          principalAgentRole: 'PRINCIPAL'
        }
      ],
      modificationTreatment: 'PROSPECTIVE'
    };
  });

  describe('calculatePriceAllocation', () => {
    it('should allocate price based on standalone selling prices', () => {
      const result = calculator.calculatePriceAllocation(mockPolicy);

      expect(result.totalTransactionPrice).toBe(100000);
      expect(result.allocations).toHaveLength(2);
      expect(result.allocationMethod).toBe('STANDALONE_PRICE');

      const po1Allocation = result.allocations.find(a => a.performanceObligationId === 'PO-1');
      const po2Allocation = result.allocations.find(a => a.performanceObligationId === 'PO-2');

      expect(po1Allocation?.allocatedAmount).toBeCloseTo(60000, 0);
      expect(po2Allocation?.allocatedAmount).toBeCloseTo(40000, 0);
    });

    it('should use residual method when one PO lacks standalone selling price', () => {
      const policyWithResidual = {
        ...mockPolicy,
        performanceObligations: [
          { ...mockPolicy.performanceObligations[0] },
          { ...mockPolicy.performanceObligations[1], standaloneSellingPrice: undefined }
        ]
      };

      const result = calculator.calculatePriceAllocation(policyWithResidual);

      expect(result.allocationMethod).toBe('RESIDUAL');
      expect(result.allocations).toHaveLength(2);
    });

    it('should handle discount allocation', () => {
      const policyWithDiscount = {
        ...mockPolicy,
        transactionPrice: 90000 // 10k discount from 100k total SSP
      };

      const result = calculator.calculatePriceAllocation(policyWithDiscount);

      expect(result.totalTransactionPrice).toBe(90000);
      expect(result.discountAllocation).toBe(10000);
      
      const totalAllocated = result.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
      expect(totalAllocated).toBeCloseTo(90000, 0);
    });
  });
});

describe('RevenueScheduleCalculator', () => {
  let calculator: RevenueScheduleCalculator;

  beforeEach(() => {
    calculator = new RevenueScheduleCalculator();
  });

  describe('calculateRevenueSchedule', () => {
    it('should create point-in-time schedule', () => {
      const po = {
        id: 'PO-1',
        description: 'License',
        revenueRecognitionMethod: 'POINT_IN_TIME' as const,
        isDistinct: true,
        satisfactionTiming: 'AT_POINT_IN_TIME' as const,
        principalAgentRole: 'PRINCIPAL' as const
      };

      const mockPolicy = {
        contractId: 'TEST-001',
        tenantId: 'tenant-test'
      } as ContractPolicy;

      const result = calculator.calculateRevenueSchedule(
        po,
        60000,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        mockPolicy
      );

      expect(result.schedule).toHaveLength(1);
      expect(result.schedule[0].recognizedAmount).toBe(60000);
      expect(result.schedule[0].progressPercentage).toBe(1.0);
    });

    it('should create over-time input-based schedule', () => {
      const po = {
        id: 'PO-2',
        description: 'Services',
        revenueRecognitionMethod: 'OVER_TIME_INPUT' as const,
        progressMetric: 'TIME_ELAPSED' as const,
        isDistinct: true,
        satisfactionTiming: 'OVER_TIME' as const,
        principalAgentRole: 'PRINCIPAL' as const
      };

      const mockPolicy = {
        contractId: 'TEST-001',
        tenantId: 'tenant-test'
      } as ContractPolicy;

      const result = calculator.calculateRevenueSchedule(
        po,
        40000,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        mockPolicy
      );

      expect(result.schedule.length).toBeGreaterThan(1);
      expect(result.recognitionMethod).toBe('OVER_TIME_INPUT');
      
      const totalRecognized = result.schedule.reduce((sum, item) => sum + item.recognizedAmount, 0);
      expect(totalRecognized).toBeCloseTo(40000, 0);
    });

    it('should create milestone-based schedule', () => {
      const po = {
        id: 'PO-3',
        description: 'Project',
        revenueRecognitionMethod: 'OVER_TIME_MILESTONE' as const,
        progressMetric: 'MILESTONES_ACHIEVED' as const,
        isDistinct: true,
        satisfactionTiming: 'OVER_TIME' as const,
        principalAgentRole: 'PRINCIPAL' as const
      };

      const mockPolicy = {
        contractId: 'TEST-001',
        tenantId: 'tenant-test'
      } as ContractPolicy;

      const result = calculator.calculateRevenueSchedule(
        po,
        100000,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
        mockPolicy
      );

      expect(result.schedule).toHaveLength(4); // 25%, 50%, 75%, 100%
      expect(result.schedule[3].progressPercentage).toBe(1.0);
      expect(result.schedule[3].cumulativeAmount).toBe(100000);
    });
  });
});

describe('ContractBalanceCalculator', () => {
  let calculator: ContractBalanceCalculator;
  let mockPolicy: ContractPolicy;
  let mockPriceAllocation: PriceAllocationPlan;
  let mockRevenueSchedules: RevenueSchedule[];

  beforeEach(() => {
    calculator = new ContractBalanceCalculator();
    
    mockPolicy = {
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
      financingComponent: { hasSignificantFinancing: false },
      upfrontFee: { hasUpfrontFee: false },
      performanceObligations: [],
      modificationTreatment: 'PROSPECTIVE'
    } as ContractPolicy;

    mockPriceAllocation = {
      contractId: 'TEST-001',
      totalTransactionPrice: 100000,
      allocationMethod: 'STANDALONE_PRICE',
      allocations: []
    };

    mockRevenueSchedules = [
      {
        contractId: 'TEST-001',
        performanceObligationId: 'PO-1',
        totalAllocatedAmount: 60000,
        recognitionMethod: 'POINT_IN_TIME',
        schedule: [
          {
            date: '2024-01-01T00:00:00Z',
            performanceObligationId: 'PO-1',
            recognizedAmount: 60000,
            cumulativeAmount: 60000,
            progressPercentage: 1.0
          }
        ]
      },
      {
        contractId: 'TEST-001',
        performanceObligationId: 'PO-2',
        totalAllocatedAmount: 40000,
        recognitionMethod: 'OVER_TIME_INPUT',
        schedule: [
          {
            date: '2024-01-01T00:00:00Z',
            performanceObligationId: 'PO-2',
            recognizedAmount: 0,
            cumulativeAmount: 0,
            progressPercentage: 0
          },
          {
            date: '2024-06-01T00:00:00Z',
            performanceObligationId: 'PO-2',
            recognizedAmount: 20000,
            cumulativeAmount: 20000,
            progressPercentage: 0.5
          },
          {
            date: '2024-12-31T00:00:00Z',
            performanceObligationId: 'PO-2',
            recognizedAmount: 20000,
            cumulativeAmount: 40000,
            progressPercentage: 1.0
          }
        ]
      }
    ];
  });

  describe('calculateContractBalance', () => {
    it('should calculate contract asset when revenue exceeds billing', () => {
      const asOfDate = new Date('2024-06-01');
      const billedToDate = 50000; // Less than recognized revenue (80000)

      const result = calculator.calculateContractBalance(
        mockPolicy,
        mockPriceAllocation,
        mockRevenueSchedules,
        asOfDate,
        billedToDate
      );

      expect(result.recognizedToDate).toBe(80000); // 60000 + 20000
      expect(result.contractAsset).toBe(30000); // 80000 - 50000
      expect(result.contractLiability).toBe(0);
      expect(result.remainingToRecognize).toBe(20000); // 100000 - 80000
    });

    it('should calculate contract liability when billing exceeds revenue', () => {
      const asOfDate = new Date('2024-06-01');
      const billedToDate = 90000; // More than recognized revenue (80000)

      const result = calculator.calculateContractBalance(
        mockPolicy,
        mockPriceAllocation,
        mockRevenueSchedules,
        asOfDate,
        billedToDate
      );

      expect(result.recognizedToDate).toBe(80000);
      expect(result.contractAsset).toBe(0);
      expect(result.contractLiability).toBe(10000); // 90000 - 80000
      expect(result.totalContractValue).toBe(100000);
    });

    it('should calculate balances at contract completion', () => {
      const asOfDate = new Date('2024-12-31');
      const billedToDate = 100000;

      const result = calculator.calculateContractBalance(
        mockPolicy,
        mockPriceAllocation,
        mockRevenueSchedules,
        asOfDate,
        billedToDate
      );

      expect(result.recognizedToDate).toBe(100000);
      expect(result.contractAsset).toBe(0);
      expect(result.contractLiability).toBe(0);
      expect(result.remainingToRecognize).toBe(0);
    });
  });
});

describe('AccountingEntryGenerator', () => {
  let generator: AccountingEntryGenerator;
  let mockPolicy: ContractPolicy;
  let mockRevenueSchedules: RevenueSchedule[];
  let mockContractBalance: any;

  beforeEach(() => {
    generator = new AccountingEntryGenerator();
    
    mockPolicy = {
      contractId: 'TEST-001'
    } as ContractPolicy;

    mockRevenueSchedules = [
      {
        contractId: 'TEST-001',
        performanceObligationId: 'PO-1',
        totalAllocatedAmount: 60000,
        recognitionMethod: 'POINT_IN_TIME',
        schedule: [
          {
            date: '2024-01-01T00:00:00Z',
            performanceObligationId: 'PO-1',
            recognizedAmount: 60000,
            cumulativeAmount: 60000,
            progressPercentage: 1.0
          }
        ]
      }
    ];

    mockContractBalance = {
      contractAsset: 30000,
      contractLiability: 0,
      refundLiability: 1000
    };
  });

  describe('generateAccountingEntries', () => {
    it('should generate revenue recognition entries', () => {
      const entries = generator.generateAccountingEntries(
        mockPolicy,
        mockRevenueSchedules,
        mockContractBalance,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const revenueEntries = entries.filter(e => e.entryType === 'REVENUE_RECOGNITION');
      expect(revenueEntries).toHaveLength(1);
      expect(revenueEntries[0].amount).toBe(60000);
      expect(revenueEntries[0].debitAccount).toBe('Contract Asset');
      expect(revenueEntries[0].creditAccount).toBe('Revenue');
    });

    it('should generate contract asset entries', () => {
      const entries = generator.generateAccountingEntries(
        mockPolicy,
        mockRevenueSchedules,
        mockContractBalance,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const assetEntries = entries.filter(e => e.entryType === 'CONTRACT_ASSET');
      expect(assetEntries).toHaveLength(1);
      expect(assetEntries[0].amount).toBe(30000);
      expect(assetEntries[0].debitAccount).toBe('Contract Asset');
      expect(assetEntries[0].creditAccount).toBe('Accounts Receivable');
    });

    it('should generate refund liability entries', () => {
      const entries = generator.generateAccountingEntries(
        mockPolicy,
        mockRevenueSchedules,
        mockContractBalance,
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );

      const refundEntries = entries.filter(e => e.entryType === 'REFUND_LIABILITY');
      expect(refundEntries).toHaveLength(1);
      expect(refundEntries[0].amount).toBe(1000);
      expect(refundEntries[0].debitAccount).toBe('Revenue');
      expect(refundEntries[0].creditAccount).toBe('Refund Liability');
    });

    it('should not generate entries outside the period', () => {
      const entries = generator.generateAccountingEntries(
        mockPolicy,
        mockRevenueSchedules,
        mockContractBalance,
        new Date('2024-02-01'),
        new Date('2024-02-28')
      );

      const revenueEntries = entries.filter(e => e.entryType === 'REVENUE_RECOGNITION');
      expect(revenueEntries).toHaveLength(0);
    });
  });
});

import { describe, it, expect, beforeEach } from '@jest/globals';
import { IFRS15PolicyEngine } from '../engine';
import { ContractPolicy } from '../types';

describe('IFRS15PolicyEngine', () => {
  let engine: IFRS15PolicyEngine;
  let mockPolicy: ContractPolicy;

  beforeEach(() => {
    engine = new IFRS15PolicyEngine();
    
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
        },
        {
          id: 'PO-2',
          description: 'Support Services',
          revenueRecognitionMethod: 'OVER_TIME_INPUT',
          progressMetric: 'TIME_ELAPSED',
          isDistinct: true,
          standaloneSellingPrice: 40000,
          allocationWeight: 0.4,
          satisfactionTiming: 'OVER_TIME',
          controlTransferIndicators: ['Stand-ready obligation'],
          principalAgentRole: 'PRINCIPAL'
        }
      ],
      modificationTreatment: 'PROSPECTIVE'
    };
  });

  describe('processContract', () => {
    it('should process a valid contract policy successfully', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await engine.processContract(mockPolicy, startDate, endDate);

      expect(result).toBeDefined();
      expect(result.contractId).toBe('TEST-001');
      expect(result.validation.overallValid).toBe(true);
      expect(result.priceAllocation.totalTransactionPrice).toBe(100000);
      expect(result.revenueSchedules).toHaveLength(2);
      expect(result.contractBalances).toBeDefined();
      expect(result.suggestedEntries.length).toBeGreaterThan(0);
    });

    it('should validate contract against IFRS 15 requirements', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await engine.processContract(mockPolicy, startDate, endDate);

      expect(result.validation.stepResults).toHaveLength(5);
      expect(result.validation.stepResults.every(step => step.isValid)).toBe(true);
      expect(result.validation.summary.totalErrors).toBe(0);
    });

    it('should calculate price allocation correctly', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await engine.processContract(mockPolicy, startDate, endDate);

      expect(result.priceAllocation.allocations).toHaveLength(2);
      
      const po1Allocation = result.priceAllocation.allocations.find(a => a.performanceObligationId === 'PO-1');
      const po2Allocation = result.priceAllocation.allocations.find(a => a.performanceObligationId === 'PO-2');

      expect(po1Allocation?.allocatedAmount).toBeCloseTo(60000, 0);
      expect(po2Allocation?.allocatedAmount).toBeCloseTo(40000, 0);
    });

    it('should generate revenue schedules for each performance obligation', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const result = await engine.processContract(mockPolicy, startDate, endDate);

      expect(result.revenueSchedules).toHaveLength(2);
      
      const po1Schedule = result.revenueSchedules.find(s => s.performanceObligationId === 'PO-1');
      const po2Schedule = result.revenueSchedules.find(s => s.performanceObligationId === 'PO-2');

      expect(po1Schedule?.recognitionMethod).toBe('POINT_IN_TIME');
      expect(po1Schedule?.schedule).toHaveLength(1); // Point in time = single entry
      
      expect(po2Schedule?.recognitionMethod).toBe('OVER_TIME_INPUT');
      expect(po2Schedule?.schedule.length).toBeGreaterThan(1); // Over time = multiple entries
    });

    it('should handle invalid policy data', async () => {
      const invalidPolicy = { ...mockPolicy, transactionPrice: -1000 };
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      await expect(
        engine.processContract(invalidPolicy, startDate, endDate)
      ).rejects.toThrow('Invalid policy data');
    });
  });

  describe('validateContractModification', () => {
    it('should validate contract modifications', () => {
      const modifiedPolicy = {
        ...mockPolicy,
        transactionPrice: 120000,
        performanceObligations: [
          ...mockPolicy.performanceObligations,
          {
            id: 'PO-3',
            description: 'Additional Services',
            revenueRecognitionMethod: 'OVER_TIME_INPUT' as const,
            progressMetric: 'TIME_ELAPSED' as const,
            isDistinct: true,
            standaloneSellingPrice: 20000,
            allocationWeight: 0.167,
            satisfactionTiming: 'OVER_TIME' as const,
            controlTransferIndicators: ['New service obligation'],
            principalAgentRole: 'PRINCIPAL' as const
          }
        ]
      };

      const result = engine.validateContractModification(mockPolicy, modifiedPolicy);

      expect(result.originalValidation.overallValid).toBe(true);
      expect(result.modifiedValidation.overallValid).toBe(true);
      expect(result.modificationValidation.isValid).toBe(true);
    });
  });

  describe('processBatch', () => {
    it('should process multiple contracts in batch', async () => {
      const contracts = [
        {
          policyData: mockPolicy,
          contractStartDate: new Date('2024-01-01'),
          contractEndDate: new Date('2024-12-31')
        },
        {
          policyData: { ...mockPolicy, contractId: 'TEST-002' },
          contractStartDate: new Date('2024-01-01'),
          contractEndDate: new Date('2024-12-31')
        }
      ];

      const results = await engine.processBatch(contracts);

      expect(results).toHaveLength(2);
      expect(results[0].contractId).toBe('TEST-001');
      expect(results[1].contractId).toBe('TEST-002');
    });
  });

  describe('getEngineInfo', () => {
    it('should return engine information', () => {
      const info = engine.getEngineInfo();

      expect(info.version).toBe('1.0.0');
      expect(info.supportedMethods).toContain('POINT_IN_TIME');
      expect(info.supportedMethods).toContain('OVER_TIME_INPUT');
      expect(info.supportedMetrics).toContain('TIME_ELAPSED');
      expect(info.capabilities).toContain('IFRS 15 5-step validation');
    });
  });
});

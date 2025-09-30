import { Test, TestingModule } from '@nestjs/testing';
import { RevenueScheduleService, PerformanceObligationScheduleInput } from '../services/revenue-schedule.service';

describe('RevenueScheduleService', () => {
  let service: RevenueScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RevenueScheduleService],
    }).compile();

    service = module.get<RevenueScheduleService>(RevenueScheduleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateRevenueSchedule - Point in Time', () => {
    it('should generate point-in-time revenue schedule', async () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-001',
        allocatedAmount: 50000,
        recognitionMethod: 'POINT_IN_TIME',
        controlTransferDate: new Date('2024-06-15')
      };

      const result = await service.generateRevenueSchedule(input);

      expect(result.performanceObligationId).toBe('PO-001');
      expect(result.recognitionMethod).toBe('POINT_IN_TIME');
      expect(result.totalAllocatedAmount).toBe(50000);
      expect(result.schedule).toHaveLength(1);
      expect(result.schedule[0].revenueAmount).toBe(50000);
      expect(result.schedule[0].progressPercentage).toBe(100);
      expect(result.summary.totalRecognized).toBe(50000);
      expect(result.summary.totalRemaining).toBe(0);
      expect(result.summary.completionPercentage).toBe(100);
    });

    it('should throw error for point-in-time without control transfer date', async () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-001',
        allocatedAmount: 50000,
        recognitionMethod: 'POINT_IN_TIME'
      };

      await expect(service.generateRevenueSchedule(input)).rejects.toThrow(
        'Control transfer date is required for point-in-time recognition'
      );
    });
  });

  describe('generateRevenueSchedule - Over Time', () => {
    it('should generate over-time schedule with time-elapsed method', async () => {
      const contractStart = new Date('2024-01-01');
      const contractEnd = new Date('2024-12-31');
      
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-002',
        allocatedAmount: 120000,
        recognitionMethod: 'OVER_TIME',
        progressMeasurement: 'TIME_ELAPSED',
        contractStartDate: contractStart,
        contractEndDate: contractEnd
      };

      const result = await service.generateRevenueSchedule(input);

      expect(result.performanceObligationId).toBe('PO-002');
      expect(result.recognitionMethod).toBe('OVER_TIME');
      expect(result.totalAllocatedAmount).toBe(120000);
      expect(result.schedule.length).toBeGreaterThan(1);
      
      // Check that revenue is spread over time
      const totalRecognized = result.schedule.reduce((sum, entry) => sum + entry.revenueAmount, 0);
      expect(totalRecognized).toBeCloseTo(120000, 2);
    });

    it('should generate schedule with cost-to-cost progress measurement', async () => {
      const contractStart = new Date('2024-01-01');
      const contractEnd = new Date('2024-06-30');
      
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-003',
        allocatedAmount: 200000,
        recognitionMethod: 'OVER_TIME',
        progressMeasurement: 'COST_TO_COST',
        contractStartDate: contractStart,
        contractEndDate: contractEnd,
        totalEstimatedCosts: 150000,
        periodicUpdates: [
          {
            periodEndDate: new Date('2024-02-29'),
            actualCostsIncurred: 45000,
            actualUnitsDelivered: 0,
            actualValueDelivered: 0
          },
          {
            periodEndDate: new Date('2024-04-30'),
            actualCostsIncurred: 90000,
            actualUnitsDelivered: 0,
            actualValueDelivered: 0
          }
        ]
      };

      const result = await service.generateRevenueSchedule(input);

      expect(result.schedule).toHaveLength(3); // 2 updates + final period
      
      // First period: 45000/150000 = 30% progress
      expect(result.schedule[0].progressPercentage).toBeCloseTo(30, 1);
      expect(result.schedule[0].revenueAmount).toBeCloseTo(60000, 0); // 200000 * 30%
      
      // Second period: 90000/150000 = 60% progress, incremental 30%
      expect(result.schedule[1].progressPercentage).toBeCloseTo(60, 1);
      expect(result.schedule[1].revenueAmount).toBeCloseTo(60000, 0); // Additional 30%
    });

    it('should generate schedule with units of delivery method', async () => {
      const contractStart = new Date('2024-01-01');
      const contractEnd = new Date('2024-04-30');
      
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-004',
        allocatedAmount: 100000,
        recognitionMethod: 'OVER_TIME',
        progressMeasurement: 'UNITS_OF_DELIVERY',
        contractStartDate: contractStart,
        contractEndDate: contractEnd,
        totalEstimatedUnits: 1000,
        periodicUpdates: [
          {
            periodEndDate: new Date('2024-01-31'),
            actualCostsIncurred: 0,
            actualUnitsDelivered: 250,
            actualValueDelivered: 0
          },
          {
            periodEndDate: new Date('2024-02-29'),
            actualCostsIncurred: 0,
            actualUnitsDelivered: 500,
            actualValueDelivered: 0
          }
        ]
      };

      const result = await service.generateRevenueSchedule(input);

      // First period: 250/1000 = 25% progress
      expect(result.schedule[0].progressPercentage).toBeCloseTo(25, 1);
      expect(result.schedule[0].revenueAmount).toBeCloseTo(25000, 0);
      
      // Second period: 500/1000 = 50% progress, incremental 25%
      expect(result.schedule[1].progressPercentage).toBeCloseTo(50, 1);
      expect(result.schedule[1].revenueAmount).toBeCloseTo(25000, 0);
    });

    it('should handle reestimates with cumulative catch-up', async () => {
      const contractStart = new Date('2024-01-01');
      const contractEnd = new Date('2024-06-30');
      
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-005',
        allocatedAmount: 300000,
        recognitionMethod: 'OVER_TIME',
        progressMeasurement: 'COST_TO_COST',
        contractStartDate: contractStart,
        contractEndDate: contractEnd,
        totalEstimatedCosts: 200000,
        periodicUpdates: [
          {
            periodEndDate: new Date('2024-02-29'),
            actualCostsIncurred: 60000,
            actualUnitsDelivered: 0,
            actualValueDelivered: 0
          },
          {
            periodEndDate: new Date('2024-04-30'),
            actualCostsIncurred: 140000,
            actualUnitsDelivered: 0,
            actualValueDelivered: 0,
            revisedTotalEstimatedCosts: 250000 // Reestimate
          }
        ]
      };

      const result = await service.generateRevenueSchedule(input);

      expect(result.reestimateHistory.length).toBeGreaterThan(0);
      
      // Check that reestimate adjustment is applied
      const reestimateEntry = result.schedule.find(entry => entry.reestimateAdjustment !== undefined);
      expect(reestimateEntry).toBeDefined();
      expect(reestimateEntry?.reestimateAdjustment).not.toBe(0);
    });

    it('should throw error for over-time without contract dates', async () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-006',
        allocatedAmount: 100000,
        recognitionMethod: 'OVER_TIME'
      };

      await expect(service.generateRevenueSchedule(input)).rejects.toThrow(
        'Contract start and end dates are required for over-time recognition'
      );
    });
  });

  describe('validateScheduleInput', () => {
    it('should return no errors for valid point-in-time input', () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-001',
        allocatedAmount: 50000,
        recognitionMethod: 'POINT_IN_TIME',
        controlTransferDate: new Date('2024-06-15')
      };

      const errors = service.validateScheduleInput(input);
      expect(errors).toHaveLength(0);
    });

    it('should return no errors for valid over-time input', () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-002',
        allocatedAmount: 100000,
        recognitionMethod: 'OVER_TIME',
        progressMeasurement: 'TIME_ELAPSED',
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2024-12-31')
      };

      const errors = service.validateScheduleInput(input);
      expect(errors).toHaveLength(0);
    });

    it('should return error for missing PO ID', () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: '',
        allocatedAmount: 50000,
        recognitionMethod: 'POINT_IN_TIME',
        controlTransferDate: new Date('2024-06-15')
      };

      const errors = service.validateScheduleInput(input);
      expect(errors).toContain('Performance obligation ID is required');
    });

    it('should return error for zero allocated amount', () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-001',
        allocatedAmount: 0,
        recognitionMethod: 'POINT_IN_TIME',
        controlTransferDate: new Date('2024-06-15')
      };

      const errors = service.validateScheduleInput(input);
      expect(errors).toContain('Allocated amount must be greater than zero');
    });

    it('should return error for point-in-time without control transfer date', () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-001',
        allocatedAmount: 50000,
        recognitionMethod: 'POINT_IN_TIME'
      };

      const errors = service.validateScheduleInput(input);
      expect(errors).toContain('Control transfer date is required for point-in-time recognition');
    });

    it('should return error for over-time without contract dates', () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-002',
        allocatedAmount: 100000,
        recognitionMethod: 'OVER_TIME'
      };

      const errors = service.validateScheduleInput(input);
      expect(errors).toContain('Contract start and end dates are required for over-time recognition');
    });

    it('should return error for invalid contract date range', () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-002',
        allocatedAmount: 100000,
        recognitionMethod: 'OVER_TIME',
        contractStartDate: new Date('2024-12-31'),
        contractEndDate: new Date('2024-01-01') // End before start
      };

      const errors = service.validateScheduleInput(input);
      expect(errors).toContain('Contract start date must be before end date');
    });

    it('should return error for cost-to-cost without estimated costs', () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-003',
        allocatedAmount: 100000,
        recognitionMethod: 'OVER_TIME',
        progressMeasurement: 'COST_TO_COST',
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2024-12-31')
      };

      const errors = service.validateScheduleInput(input);
      expect(errors).toContain('Total estimated costs required for cost-to-cost progress measurement');
    });

    it('should return error for units method without estimated units', () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-004',
        allocatedAmount: 100000,
        recognitionMethod: 'OVER_TIME',
        progressMeasurement: 'UNITS_OF_DELIVERY',
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2024-12-31')
      };

      const errors = service.validateScheduleInput(input);
      expect(errors).toContain('Total estimated units required for units of delivery progress measurement');
    });

    it('should return error for value method without estimated value', () => {
      const input: PerformanceObligationScheduleInput = {
        performanceObligationId: 'PO-005',
        allocatedAmount: 100000,
        recognitionMethod: 'OVER_TIME',
        progressMeasurement: 'VALUE_OF_DELIVERY',
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2024-12-31')
      };

      const errors = service.validateScheduleInput(input);
      expect(errors).toContain('Total estimated value required for value of delivery progress measurement');
    });
  });
});

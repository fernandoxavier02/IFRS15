import { Test, TestingModule } from '@nestjs/testing';
import { PriceAllocationService, PriceAllocationInput } from '../services/price-allocation.service';

describe('PriceAllocationService', () => {
  let service: PriceAllocationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PriceAllocationService],
    }).compile();

    service = module.get<PriceAllocationService>(PriceAllocationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('allocateTransactionPrice', () => {
    it('should allocate price using standalone selling prices', async () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-001',
        adjustedTransactionPrice: 150000,
        performanceObligations: [
          {
            id: 'PO-001',
            description: 'Software License',
            standaloneSellingPrice: 100000,
            isDistinct: true
          },
          {
            id: 'PO-002',
            description: 'Implementation Services',
            standaloneSellingPrice: 80000,
            isDistinct: true
          }
        ],
        allocationMethod: 'STANDALONE_PRICE'
      };

      const result = await service.allocateTransactionPrice(input);

      expect(result.contractId).toBe('CONTRACT-001');
      expect(result.totalTransactionPrice).toBe(150000);
      expect(result.totalStandaloneSellingPrice).toBe(180000);
      expect(result.totalDiscount).toBe(30000);
      expect(result.allocations).toHaveLength(2);

      // Check proportional allocation
      const softwareAllocation = result.allocations.find(a => a.performanceObligationId === 'PO-001');
      const servicesAllocation = result.allocations.find(a => a.performanceObligationId === 'PO-002');

      expect(softwareAllocation?.allocatedAmount).toBeCloseTo(83333.33, 2); // 150000 * (100000/180000)
      expect(servicesAllocation?.allocatedAmount).toBeCloseTo(66666.67, 2); // 150000 * (80000/180000)
      expect(result.validation.isValid).toBe(true);
    });

    it('should use residual approach when one PO lacks SSP', async () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-002',
        adjustedTransactionPrice: 120000,
        performanceObligations: [
          {
            id: 'PO-001',
            description: 'Product A',
            standaloneSellingPrice: 60000,
            isDistinct: true
          },
          {
            id: 'PO-002',
            description: 'Product B',
            standaloneSellingPrice: 40000,
            isDistinct: true
          },
          {
            id: 'PO-003',
            description: 'Custom Service',
            isDistinct: true
          }
        ],
        allocationMethod: 'AUTO'
      };

      const result = await service.allocateTransactionPrice(input);

      expect(result.allocationMethod).toBe('RESIDUAL');
      
      const customServiceAllocation = result.allocations.find(a => a.performanceObligationId === 'PO-003');
      expect(customServiceAllocation?.allocatedAmount).toBe(20000); // 120000 - 60000 - 40000
      expect(customServiceAllocation?.allocationBasis).toBe('RESIDUAL');
    });

    it('should use cost plus margin for estimation', async () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-003',
        adjustedTransactionPrice: 100000,
        performanceObligations: [
          {
            id: 'PO-001',
            description: 'Service A',
            isDistinct: true,
            estimatedCost: 30000,
            marginPercentage: 0.5
          },
          {
            id: 'PO-002',
            description: 'Service B',
            isDistinct: true,
            estimatedCost: 20000,
            marginPercentage: 0.6
          }
        ],
        allocationMethod: 'COST_PLUS_MARGIN'
      };

      const result = await service.allocateTransactionPrice(input);

      // Expected SSPs: PO-001 = 45000 (30000 * 1.5), PO-002 = 32000 (20000 * 1.6)
      // Total SSP = 77000
      const serviceAAllocation = result.allocations.find(a => a.performanceObligationId === 'PO-001');
      const serviceBAllocation = result.allocations.find(a => a.performanceObligationId === 'PO-002');

      expect(serviceAAllocation?.standaloneSellingPrice).toBe(45000);
      expect(serviceBAllocation?.standaloneSellingPrice).toBe(32000);
      expect(serviceAAllocation?.allocatedAmount).toBeCloseTo(58441.56, 2); // 100000 * (45000/77000)
      expect(serviceBAllocation?.allocatedAmount).toBeCloseTo(41558.44, 2); // 100000 * (32000/77000)
    });

    it('should apply proportional discount allocation', async () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-004',
        adjustedTransactionPrice: 90000,
        performanceObligations: [
          {
            id: 'PO-001',
            description: 'Product A',
            standaloneSellingPrice: 60000,
            isDistinct: true
          },
          {
            id: 'PO-002',
            description: 'Product B',
            standaloneSellingPrice: 40000,
            isDistinct: true
          }
        ],
        discountAllocation: 'PROPORTIONAL'
      };

      const result = await service.allocateTransactionPrice(input);

      expect(result.totalDiscount).toBe(10000); // 100000 - 90000
      
      const productAAllocation = result.allocations.find(a => a.performanceObligationId === 'PO-001');
      const productBAllocation = result.allocations.find(a => a.performanceObligationId === 'PO-002');

      // Discount should be allocated proportionally: A gets 6000, B gets 4000
      expect(productAAllocation?.adjustments.discountAdjustment).toBe(-6000);
      expect(productBAllocation?.adjustments.discountAdjustment).toBe(-4000);
      expect(productAAllocation?.allocatedAmount).toBe(54000); // 60000 - 6000
      expect(productBAllocation?.allocatedAmount).toBe(36000); // 40000 - 4000
    });

    it('should apply specific PO discount allocation', async () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-005',
        adjustedTransactionPrice: 85000,
        performanceObligations: [
          {
            id: 'PO-001',
            description: 'Product A',
            standaloneSellingPrice: 60000,
            isDistinct: true
          },
          {
            id: 'PO-002',
            description: 'Product B',
            standaloneSellingPrice: 40000,
            isDistinct: true
          }
        ],
        discountAllocation: 'SPECIFIC_PO',
        specificDiscountPO: 'PO-001'
      };

      const result = await service.allocateTransactionPrice(input);

      const productAAllocation = result.allocations.find(a => a.performanceObligationId === 'PO-001');
      const productBAllocation = result.allocations.find(a => a.performanceObligationId === 'PO-002');

      // Entire discount of 15000 should go to PO-001
      expect(productAAllocation?.adjustments.discountAdjustment).toBe(-15000);
      expect(productBAllocation?.adjustments.discountAdjustment).toBe(0);
      expect(productAAllocation?.allocatedAmount).toBeCloseTo(45000, 2);
      expect(productBAllocation?.allocatedAmount).toBeCloseTo(40000, 2);
    });

    it('should handle rounding adjustments', async () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-006',
        adjustedTransactionPrice: 100001, // Odd amount to force rounding
        performanceObligations: [
          {
            id: 'PO-001',
            description: 'Service A',
            standaloneSellingPrice: 33333,
            isDistinct: true
          },
          {
            id: 'PO-002',
            description: 'Service B',
            standaloneSellingPrice: 33333,
            isDistinct: true
          },
          {
            id: 'PO-003',
            description: 'Service C',
            standaloneSellingPrice: 33334,
            isDistinct: true
          }
        ]
      };

      const result = await service.allocateTransactionPrice(input);

      const totalAllocated = result.allocations.reduce((sum, a) => sum + a.allocatedAmount, 0);
      expect(totalAllocated).toBe(100001);
      expect(result.validation.isValid).toBe(true);
      expect(result.validation.allocationVariance).toBeLessThan(0.01);
    });

    it('should detect validation issues', async () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-007',
        adjustedTransactionPrice: 50000,
        performanceObligations: [
          {
            id: 'PO-001',
            description: 'Service A',
            standaloneSellingPrice: 100000, // SSP higher than transaction price
            isDistinct: true
          }
        ]
      };

      const result = await service.allocateTransactionPrice(input);

      expect(result.allocations[0].allocatedAmount).toBe(50000);
      expect(result.validation.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateAllocationInput', () => {
    it('should return no errors for valid input', () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-001',
        adjustedTransactionPrice: 100000,
        performanceObligations: [
          {
            id: 'PO-001',
            description: 'Service A',
            standaloneSellingPrice: 60000,
            isDistinct: true
          }
        ]
      };

      const errors = service.validateAllocationInput(input);
      expect(errors).toHaveLength(0);
    });

    it('should return error for zero transaction price', () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-001',
        adjustedTransactionPrice: 0,
        performanceObligations: [
          {
            id: 'PO-001',
            description: 'Service A',
            isDistinct: true
          }
        ]
      };

      const errors = service.validateAllocationInput(input);
      expect(errors).toContain('Adjusted transaction price must be greater than zero');
    });

    it('should return error for empty performance obligations', () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-001',
        adjustedTransactionPrice: 100000,
        performanceObligations: []
      };

      const errors = service.validateAllocationInput(input);
      expect(errors).toContain('At least one performance obligation is required');
    });

    it('should return error for duplicate PO IDs', () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-001',
        adjustedTransactionPrice: 100000,
        performanceObligations: [
          {
            id: 'PO-001',
            description: 'Service A',
            isDistinct: true
          },
          {
            id: 'PO-001', // Duplicate ID
            description: 'Service B',
            isDistinct: true
          }
        ]
      };

      const errors = service.validateAllocationInput(input);
      expect(errors).toContain('Performance obligation IDs must be unique');
    });

    it('should return error for invalid specific discount PO', () => {
      const input: PriceAllocationInput = {
        contractId: 'CONTRACT-001',
        adjustedTransactionPrice: 100000,
        performanceObligations: [
          {
            id: 'PO-001',
            description: 'Service A',
            isDistinct: true
          }
        ],
        discountAllocation: 'SPECIFIC_PO',
        specificDiscountPO: 'PO-999' // Non-existent PO
      };

      const errors = service.validateAllocationInput(input);
      expect(errors).toContain('Specific discount PO ID does not exist in performance obligations');
    });
  });
});

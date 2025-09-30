import { Contract, PerformanceObligation, ContractStatus, SatisfactionMethod } from '@ifrs15/shared';

export class ContractEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly customerId: string,
    public contractNumber: string,
    public title: string,
    public description: string | undefined,
    public startDate: Date,
    public endDate: Date | undefined,
    public totalValue: number,
    public currency: string,
    public status: ContractStatus,
    public performanceObligations: PerformanceObligationEntity[] = [],
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static fromContract(contract: Contract): ContractEntity {
    return new ContractEntity(
      contract.id,
      contract.tenantId,
      contract.customerId,
      contract.contractNumber,
      contract.title,
      contract.description,
      contract.startDate,
      contract.endDate,
      contract.totalValue,
      contract.currency,
      contract.status,
      contract.performanceObligations.map(po => PerformanceObligationEntity.fromPerformanceObligation(po)),
      contract.createdAt,
      contract.updatedAt
    );
  }

  toContract(): Contract {
    return {
      id: this.id,
      tenantId: this.tenantId,
      customerId: this.customerId,
      contractNumber: this.contractNumber,
      title: this.title,
      description: this.description,
      startDate: this.startDate,
      endDate: this.endDate,
      totalValue: this.totalValue,
      currency: this.currency,
      status: this.status,
      performanceObligations: this.performanceObligations.map(po => po.toPerformanceObligation()),
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // IFRS 15 Step 2: Identify performance obligations
  identifyPerformanceObligations(): PerformanceObligationEntity[] {
    return this.performanceObligations.filter(po => po.isDistinct);
  }

  // IFRS 15 Step 3: Determine transaction price
  getTransactionPrice(): number {
    return this.totalValue;
  }

  // IFRS 15 Step 4: Allocate transaction price to performance obligations
  allocateTransactionPrice(): void {
    const distinctObligations = this.identifyPerformanceObligations();
    const totalStandalonePrice = distinctObligations.reduce((sum, po) => sum + po.standaloneSellingPrice, 0);

    if (totalStandalonePrice === 0) {
      throw new Error('Cannot allocate transaction price: total standalone selling price is zero');
    }

    distinctObligations.forEach(po => {
      const allocationRatio = po.standaloneSellingPrice / totalStandalonePrice;
      po.allocatedAmount = this.totalValue * allocationRatio;
    });
  }

  // Validate contract according to IFRS 15 criteria
  validateContract(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Step 1: Contract with customer exists
    if (!this.customerId) {
      errors.push('Contract must have a customer');
    }

    if (!this.startDate) {
      errors.push('Contract must have a start date');
    }

    if (this.totalValue <= 0) {
      errors.push('Contract must have a positive total value');
    }

    // Performance obligations validation
    if (this.performanceObligations.length === 0) {
      errors.push('Contract must have at least one performance obligation');
    }

    const totalAllocated = this.performanceObligations.reduce((sum, po) => sum + po.allocatedAmount, 0);
    if (Math.abs(totalAllocated - this.totalValue) > 0.01) {
      errors.push('Total allocated amount must equal contract total value');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  canActivate(): boolean {
    const validation = this.validateContract();
    return validation.isValid && this.status === ContractStatus.DRAFT;
  }

  activate(): void {
    if (!this.canActivate()) {
      throw new Error('Cannot activate contract: validation failed');
    }
    this.status = ContractStatus.ACTIVE;
  }

  complete(): void {
    if (this.status !== ContractStatus.ACTIVE) {
      throw new Error('Cannot complete contract: contract must be active');
    }
    this.status = ContractStatus.COMPLETED;
  }

  cancel(): void {
    if (this.status === ContractStatus.COMPLETED) {
      throw new Error('Cannot cancel completed contract');
    }
    this.status = ContractStatus.CANCELLED;
  }
}

export class PerformanceObligationEntity {
  constructor(
    public readonly id: string,
    public readonly contractId: string,
    public description: string,
    public allocatedAmount: number,
    public recognizedAmount: number,
    public isDistinct: boolean,
    public satisfactionMethod: SatisfactionMethod,
    public estimatedCompletionDate: Date | undefined,
    public standaloneSellingPrice: number = 0,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static fromPerformanceObligation(po: PerformanceObligation): PerformanceObligationEntity {
    return new PerformanceObligationEntity(
      po.id,
      po.contractId,
      po.description,
      po.allocatedAmount,
      po.recognizedAmount,
      po.isDistinct,
      po.satisfactionMethod,
      po.estimatedCompletionDate,
      0, // standaloneSellingPrice not in interface, default to 0
      po.createdAt,
      po.updatedAt
    );
  }

  toPerformanceObligation(): PerformanceObligation {
    return {
      id: this.id,
      contractId: this.contractId,
      description: this.description,
      allocatedAmount: this.allocatedAmount,
      recognizedAmount: this.recognizedAmount,
      isDistinct: this.isDistinct,
      satisfactionMethod: this.satisfactionMethod,
      estimatedCompletionDate: this.estimatedCompletionDate,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // IFRS 15 Step 5: Recognize revenue when performance obligation is satisfied
  getRemainingAmount(): number {
    return this.allocatedAmount - this.recognizedAmount;
  }

  getCompletionPercentage(): number {
    if (this.allocatedAmount === 0) return 0;
    return (this.recognizedAmount / this.allocatedAmount) * 100;
  }

  isSatisfied(): boolean {
    return this.recognizedAmount >= this.allocatedAmount;
  }

  canRecognizeRevenue(amount: number): boolean {
    return amount > 0 && (this.recognizedAmount + amount) <= this.allocatedAmount;
  }

  recognizeRevenue(amount: number): void {
    if (!this.canRecognizeRevenue(amount)) {
      throw new Error('Cannot recognize revenue: amount exceeds remaining allocation');
    }
    this.recognizedAmount += amount;
  }

  // For over-time satisfaction method, calculate progress
  calculateProgressPercentage(actualCosts: number, estimatedTotalCosts: number): number {
    if (this.satisfactionMethod !== SatisfactionMethod.OVER_TIME) {
      throw new Error('Progress calculation only applicable for over-time satisfaction method');
    }
    
    if (estimatedTotalCosts === 0) return 0;
    return Math.min((actualCosts / estimatedTotalCosts) * 100, 100);
  }

  calculateRevenueToRecognize(progressPercentage: number): number {
    if (this.satisfactionMethod === SatisfactionMethod.POINT_IN_TIME) {
      return this.isSatisfied() ? 0 : this.allocatedAmount;
    }

    const totalRevenueToRecognize = (this.allocatedAmount * progressPercentage) / 100;
    return Math.max(0, totalRevenueToRecognize - this.recognizedAmount);
  }
}

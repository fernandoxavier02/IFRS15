import { RevenueRecognition, RevenueRecognitionStatus } from '@ifrs15/shared';

export class RevenueRecognitionEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public readonly contractId: string,
    public readonly performanceObligationId: string,
    public amount: number,
    public recognitionDate: Date,
    public period: string,
    public description: string | undefined,
    public status: RevenueRecognitionStatus = RevenueRecognitionStatus.PENDING,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static fromRevenueRecognition(revenue: RevenueRecognition): RevenueRecognitionEntity {
    return new RevenueRecognitionEntity(
      revenue.id,
      revenue.tenantId,
      revenue.contractId,
      revenue.performanceObligationId,
      revenue.amount,
      revenue.recognitionDate,
      revenue.period,
      revenue.description,
      RevenueRecognitionStatus.PENDING, // Default status
      revenue.createdAt,
      revenue.updatedAt
    );
  }

  toRevenueRecognition(): RevenueRecognition {
    return {
      id: this.id,
      tenantId: this.tenantId,
      contractId: this.contractId,
      performanceObligationId: this.performanceObligationId,
      amount: this.amount,
      recognitionDate: this.recognitionDate,
      period: this.period,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  // Validate revenue recognition entry
  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (this.amount <= 0) {
      errors.push('Revenue amount must be positive');
    }

    if (!this.recognitionDate) {
      errors.push('Recognition date is required');
    }

    if (!this.period.match(/^\d{4}-\d{2}$/)) {
      errors.push('Period must be in YYYY-MM format');
    }

    // Validate that recognition date matches the period
    const periodDate = new Date(this.period + '-01');
    const recognitionMonth = this.recognitionDate.getFullYear() + '-' + 
      String(this.recognitionDate.getMonth() + 1).padStart(2, '0');
    
    if (this.period !== recognitionMonth) {
      errors.push('Recognition date must be within the specified period');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  canRecognize(): boolean {
    const validation = this.validate();
    return validation.isValid && this.status === RevenueRecognitionStatus.PENDING;
  }

  recognize(): void {
    if (!this.canRecognize()) {
      throw new Error('Cannot recognize revenue: validation failed or already recognized');
    }
    this.status = RevenueRecognitionStatus.RECOGNIZED;
  }

  reverse(): void {
    if (this.status !== RevenueRecognitionStatus.RECOGNIZED) {
      throw new Error('Cannot reverse revenue: must be in recognized status');
    }
    this.status = RevenueRecognitionStatus.REVERSED;
  }

  // Check if this revenue recognition is for the current period
  isCurrentPeriod(): boolean {
    const now = new Date();
    const currentPeriod = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    return this.period === currentPeriod;
  }

  // Check if this revenue recognition is overdue
  isOverdue(): boolean {
    const now = new Date();
    const periodDate = new Date(this.period + '-01');
    return periodDate < now && this.status === RevenueRecognitionStatus.PENDING;
  }
}

import { RevenueRecognitionEntity } from '../entities';
import { RevenueQueryDto } from '@ifrs15/shared';

export interface RevenueRecognitionRepository {
  findById(id: string, tenantId: string): Promise<RevenueRecognitionEntity | null>;
  findByContractId(contractId: string, tenantId: string): Promise<RevenueRecognitionEntity[]>;
  findByPerformanceObligationId(performanceObligationId: string, tenantId: string): Promise<RevenueRecognitionEntity[]>;
  findByPeriod(period: string, tenantId: string): Promise<RevenueRecognitionEntity[]>;
  findMany(query: RevenueQueryDto, tenantId: string): Promise<{
    revenues: RevenueRecognitionEntity[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  create(revenue: RevenueRecognitionEntity): Promise<RevenueRecognitionEntity>;
  update(id: string, revenue: Partial<RevenueRecognitionEntity>, tenantId: string): Promise<RevenueRecognitionEntity>;
  delete(id: string, tenantId: string): Promise<void>;
  findPendingRecognitions(tenantId: string): Promise<RevenueRecognitionEntity[]>;
  findRevenueByDateRange(startDate: Date, endDate: Date, tenantId: string): Promise<RevenueRecognitionEntity[]>;
  getTotalRevenueByPeriod(period: string, tenantId: string): Promise<number>;
}

import { Module } from '@nestjs/common';
import { RevenueController } from './controllers/revenue.controller';
import { TransactionPriceService } from './services/transaction-price.service';
import { PriceAllocationService } from './services/price-allocation.service';
import { RevenueScheduleService } from './services/revenue-schedule.service';
import { ContractModificationService } from './services/contract-modification.service';

@Module({
  controllers: [RevenueController],
  providers: [
    TransactionPriceService,
    PriceAllocationService,
    RevenueScheduleService,
    ContractModificationService
  ],
  exports: [
    TransactionPriceService,
    PriceAllocationService,
    RevenueScheduleService,
    ContractModificationService
  ]
})
export class RevenueModule {}

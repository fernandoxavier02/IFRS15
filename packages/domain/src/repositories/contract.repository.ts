import { ContractEntity } from '../entities';
import { PaginationQueryDto, ContractQueryDto } from '@ifrs15/shared';

export interface ContractRepository {
  findById(id: string, tenantId: string): Promise<ContractEntity | null>;
  findByContractNumber(contractNumber: string, tenantId: string): Promise<ContractEntity | null>;
  findMany(query: ContractQueryDto, tenantId: string): Promise<{
    contracts: ContractEntity[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  create(contract: ContractEntity): Promise<ContractEntity>;
  update(id: string, contract: Partial<ContractEntity>, tenantId: string): Promise<ContractEntity>;
  delete(id: string, tenantId: string): Promise<void>;
  findByCustomerId(customerId: string, tenantId: string): Promise<ContractEntity[]>;
  findActiveContracts(tenantId: string): Promise<ContractEntity[]>;
  findContractsWithUnrecognizedRevenue(tenantId: string): Promise<ContractEntity[]>;
}

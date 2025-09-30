import { CustomerEntity } from '../entities';
import { PaginationQueryDto } from '@ifrs15/shared';

export interface CustomerRepository {
  findById(id: string, tenantId: string): Promise<CustomerEntity | null>;
  findByEmail(email: string, tenantId: string): Promise<CustomerEntity | null>;
  findByTaxId(taxId: string, tenantId: string): Promise<CustomerEntity | null>;
  findMany(query: PaginationQueryDto, tenantId: string): Promise<{
    customers: CustomerEntity[];
    total: number;
    page: number;
    totalPages: number;
  }>;
  create(customer: CustomerEntity): Promise<CustomerEntity>;
  update(id: string, customer: Partial<CustomerEntity>, tenantId: string): Promise<CustomerEntity>;
  delete(id: string, tenantId: string): Promise<void>;
  findActiveCustomers(tenantId: string): Promise<CustomerEntity[]>;
  search(searchTerm: string, tenantId: string): Promise<CustomerEntity[]>;
}

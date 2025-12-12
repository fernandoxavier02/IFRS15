import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
}

export interface Contract {
  id: string;
  tenantId: string;
  contractNumber: string;
  customerId: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status: ContractStatus;
  totalValue: number;
  currency: string;
  paymentTerms?: string;
  createdAt: string;
  updatedAt: string;
  customer?: {
    id: string;
    name: string;
    email?: string;
  };
  performanceObligations?: any[];
  transactionPrice?: {
    totalAmount: number;
    currency: string;
  };
  revenueSchedules?: any[];
}

export interface CreateContractDto {
  contractNumber: string;
  customerId: string;
  description?: string;
  startDate: string;
  endDate?: string;
  status?: ContractStatus;
  totalValue: number;
  currency?: string;
  paymentTerms?: string;
}

export interface UpdateContractDto {
  contractNumber?: string;
  customerId?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: ContractStatus;
  totalValue?: number;
  currency?: string;
  paymentTerms?: string;
}

export interface ContractsResponse {
  data: Contract[];
  meta: {
    total: number;
    skip: number;
    take: number;
  };
}

export interface RevenueScheduleResponse {
  contractId: string;
  contractNumber: string;
  revenueSchedules: any[];
}

@Injectable({
  providedIn: 'root'
})
export class ContractsService {
  private readonly baseUrl = `${environment.apiUrl}/contracts`;

  constructor(private http: HttpClient) {}

  /**
   * Get all contracts with pagination and filters
   */
  getContracts(params?: {
    skip?: number;
    take?: number;
    status?: string;
    customerId?: string;
    search?: string;
  }): Observable<ContractsResponse> {
    let httpParams = new HttpParams();
    
    if (params?.skip !== undefined) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }
    if (params?.take !== undefined) {
      httpParams = httpParams.set('take', params.take.toString());
    }
    if (params?.status) {
      httpParams = httpParams.set('status', params.status);
    }
    if (params?.customerId) {
      httpParams = httpParams.set('customerId', params.customerId);
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<ContractsResponse>(this.baseUrl, { params: httpParams });
  }

  /**
   * Get a single contract by ID
   */
  getContract(id: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get a contract by contract number
   */
  getContractByNumber(contractNumber: string): Observable<Contract> {
    return this.http.get<Contract>(`${this.baseUrl}/number/${contractNumber}`);
  }

  /**
   * Create a new contract
   */
  createContract(contract: CreateContractDto): Observable<Contract> {
    return this.http.post<Contract>(this.baseUrl, contract);
  }

  /**
   * Update an existing contract
   */
  updateContract(id: string, contract: UpdateContractDto): Observable<Contract> {
    return this.http.patch<Contract>(`${this.baseUrl}/${id}`, contract);
  }

  /**
   * Delete a contract (cancel)
   */
  deleteContract(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Get contracts by status
   */
  getContractsByStatus(status: ContractStatus): Observable<Contract[]> {
    const params = new HttpParams().set('status', status);
    return this.http.get<Contract[]>(this.baseUrl, { params });
  }

  /**
   * Get contracts by customer
   */
  getContractsByCustomer(customerId: string): Observable<Contract[]> {
    const params = new HttpParams().set('customerId', customerId);
    return this.http.get<Contract[]>(this.baseUrl, { params });
  }

  /**
   * Search contracts
   */
  searchContracts(query: string): Observable<Contract[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<Contract[]>(this.baseUrl, { params });
  }

  /**
   * Get revenue schedule for a contract
   */
  getRevenueSchedule(id: string): Observable<RevenueScheduleResponse> {
    return this.http.get<RevenueScheduleResponse>(`${this.baseUrl}/${id}/revenue-schedule`);
  }
}

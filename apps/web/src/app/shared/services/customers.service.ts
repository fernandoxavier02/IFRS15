import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Customer {
  id: string;
  tenantId: string;
  name: string;
  email?: string;
  taxId?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  contracts?: any[];
}

export interface CreateCustomerDto {
  name: string;
  email?: string;
  taxId?: string;
  address?: object;
  isActive?: boolean;
}

export interface UpdateCustomerDto {
  name?: string;
  email?: string;
  taxId?: string;
  address?: object;
  isActive?: boolean;
}

export interface CustomersResponse {
  data: Customer[];
  meta: {
    total: number;
    skip: number;
    take: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CustomersService {
  private readonly baseUrl = `${environment.apiUrl}/customers`;

  constructor(private http: HttpClient) {}

  /**
   * Get all customers with pagination and filters
   */
  getCustomers(params?: {
    skip?: number;
    take?: number;
    search?: string;
  }): Observable<CustomersResponse> {
    let httpParams = new HttpParams();
    
    if (params?.skip !== undefined) {
      httpParams = httpParams.set('skip', params.skip.toString());
    }
    if (params?.take !== undefined) {
      httpParams = httpParams.set('take', params.take.toString());
    }
    if (params?.search) {
      httpParams = httpParams.set('search', params.search);
    }

    return this.http.get<CustomersResponse>(this.baseUrl, { params: httpParams });
  }

  /**
   * Get a single customer by ID
   */
  getCustomer(id: string): Observable<Customer> {
    return this.http.get<Customer>(`${this.baseUrl}/${id}`);
  }

  /**
   * Create a new customer
   */
  createCustomer(customer: CreateCustomerDto): Observable<Customer> {
    return this.http.post<Customer>(this.baseUrl, customer);
  }

  /**
   * Update an existing customer
   */
  updateCustomer(id: string, customer: UpdateCustomerDto): Observable<Customer> {
    return this.http.patch<Customer>(`${this.baseUrl}/${id}`, customer);
  }

  /**
   * Delete a customer (soft delete)
   */
  deleteCustomer(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Search customers
   */
  searchCustomers(query: string): Observable<Customer[]> {
    const params = new HttpParams().set('search', query);
    return this.http.get<Customer[]>(this.baseUrl, { params });
  }
}

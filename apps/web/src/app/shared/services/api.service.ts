import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  // Generic CRUD operations
  get<T>(endpoint: string, params?: any): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }

    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, {
      headers: this.getHeaders(),
      params: httpParams
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  post<T>(endpoint: string, data: any): Observable<T> {
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  put<T>(endpoint: string, data: any): Observable<T> {
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, data, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response.data),
      catchError(this.handleError)
    );
  }

  // Paginated requests
  getPaginated<T>(endpoint: string, page: number = 1, limit: number = 10, filters?: any): Observable<PaginatedResponse<T>> {
    const params = {
      page: page.toString(),
      limit: limit.toString(),
      ...filters
    };

    return this.get<PaginatedResponse<T>>(endpoint, params);
  }

  private handleError(error: any): Observable<never> {
    let errorMessage = 'An error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.errors) {
      errorMessage = error.error.errors.join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    console.error('API Error:', error);
    return throwError(() => new Error(errorMessage));
  }
}

// Specific API services
@Injectable({
  providedIn: 'root'
})
export class ContractsApiService {
  constructor(private api: ApiService) {}

  getContracts(page?: number, limit?: number, filters?: any): Observable<PaginatedResponse<any>> {
    return this.api.getPaginated('contratos', page, limit, filters);
  }

  getContract(id: string): Observable<any> {
    return this.api.get(`contratos/${id}`);
  }

  createContract(contract: any): Observable<any> {
    return this.api.post('contratos', contract);
  }

  updateContract(id: string, contract: any): Observable<any> {
    return this.api.put(`contratos/${id}`, contract);
  }

  deleteContract(id: string): Observable<any> {
    return this.api.delete(`contratos/${id}`);
  }

  evaluateContract(id: string): Observable<any> {
    return this.api.post(`contratos/${id}/avaliar`, {});
  }

  getRevenueSchedule(id: string): Observable<any> {
    return this.api.get(`contratos/${id}/agenda`);
  }

  modifyContract(id: string, modification: any): Observable<any> {
    return this.api.post(`contratos/${id}/modificar`, modification);
  }
}

@Injectable({
  providedIn: 'root'
})
export class DACApiService {
  constructor(private api: ApiService) {}

  getDACList(page?: number, limit?: number): Observable<PaginatedResponse<any>> {
    return this.api.getPaginated('dac', page, limit);
  }

  registerDAC(dac: any): Observable<any> {
    return this.api.post('dac', dac);
  }

  getAmortizationSchedule(id: string): Observable<any> {
    return this.api.get(`dac/${id}/agenda`);
  }

  performImpairmentTest(id: string, testData: any): Observable<any> {
    return this.api.post(`dac/${id}/teste-impairment`, testData);
  }

  getDACStatus(id: string): Observable<any> {
    return this.api.get(`dac/${id}/status`);
  }

  reestimateDAC(id: string, reestimateData: any): Observable<any> {
    return this.api.post(`dac/${id}/reestimate`, reestimateData);
  }
}

@Injectable({
  providedIn: 'root'
})
export class PoliciesApiService {
  constructor(private api: ApiService) {}

  getPolicies(page?: number, limit?: number): Observable<PaginatedResponse<any>> {
    return this.api.getPaginated('policies', page, limit);
  }

  getPolicy(id: string): Observable<any> {
    return this.api.get(`policies/${id}`);
  }

  createPolicy(policy: any): Observable<any> {
    return this.api.post('policies', policy);
  }

  updatePolicy(id: string, policy: any): Observable<any> {
    return this.api.put(`policies/${id}`, policy);
  }

  getPolicySnapshots(contractId: string): Observable<any> {
    return this.api.get(`policies/snapshots/${contractId}`);
  }

  restoreSnapshot(contractId: string, version: number): Observable<any> {
    return this.api.post(`policies/snapshots/${contractId}/restore`, { version });
  }
}

@Injectable({
  providedIn: 'root'
})
export class ClientsApiService {
  constructor(private api: ApiService) {}

  getClients(page?: number, limit?: number, filters?: any): Observable<PaginatedResponse<any>> {
    return this.api.getPaginated('clients', page, limit, filters);
  }

  getClient(id: string): Observable<any> {
    return this.api.get(`clients/${id}`);
  }

  createClient(client: any): Observable<any> {
    return this.api.post('clients', client);
  }

  updateClient(id: string, client: any): Observable<any> {
    return this.api.put(`clients/${id}`, client);
  }

  deleteClient(id: string): Observable<any> {
    return this.api.delete(`clients/${id}`);
  }

  exportClients(filters?: any): Observable<Blob> {
    return this.api.get<Blob>('/clients/export', {
      params: filters,
      responseType: 'blob' as 'json'
    }) as Observable<Blob>;
  }
}

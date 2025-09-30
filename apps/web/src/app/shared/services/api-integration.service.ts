import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface ApiResponse<T> {
  data: T;
  total?: number;
  page?: number;
  limit?: number;
  success: boolean;
  message?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: { [key: string]: any };
}

@Injectable({
  providedIn: 'root'
})
export class ApiIntegrationService {
  private baseUrl = environment.apiUrl || 'http://localhost:3000/api';
  private loadingSubject = new BehaviorSubject<boolean>(false);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  // Generic CRUD operations
  get<T>(endpoint: string, params?: PaginationParams): Observable<ApiResponse<T[]>> {
    this.setLoading(true);
    
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        const value = (params as any)[key];
        if (value !== null && value !== undefined && value !== '') {
          if (key === 'filters' && typeof value === 'object') {
            Object.keys(value).forEach(filterKey => {
              httpParams = httpParams.set(`filter[${filterKey}]`, value[filterKey]);
            });
          } else {
            httpParams = httpParams.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<ApiResponse<T[]>>(`${this.baseUrl}/${endpoint}`, { params: httpParams })
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(error => {
          this.setLoading(false);
          return throwError(error);
        })
      );
  }

  getById<T>(endpoint: string, id: string): Observable<ApiResponse<T>> {
    this.setLoading(true);
    
    return this.http.get<ApiResponse<T>>(`${this.baseUrl}/${endpoint}/${id}`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(error => {
          this.setLoading(false);
          return throwError(error);
        })
      );
  }

  create<T>(endpoint: string, data: Partial<T>): Observable<ApiResponse<T>> {
    this.setLoading(true);
    
    return this.http.post<ApiResponse<T>>(`${this.baseUrl}/${endpoint}`, data)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(error => {
          this.setLoading(false);
          return throwError(error);
        })
      );
  }

  update<T>(endpoint: string, id: string, data: Partial<T>): Observable<ApiResponse<T>> {
    this.setLoading(true);
    
    return this.http.put<ApiResponse<T>>(`${this.baseUrl}/${endpoint}/${id}`, data)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(error => {
          this.setLoading(false);
          return throwError(error);
        })
      );
  }

  delete(endpoint: string, id: string): Observable<ApiResponse<void>> {
    this.setLoading(true);
    
    return this.http.delete<ApiResponse<void>>(`${this.baseUrl}/${endpoint}/${id}`)
      .pipe(
        tap(() => this.setLoading(false)),
        catchError(error => {
          this.setLoading(false);
          return throwError(error);
        })
      );
  }

  // IFRS 15 specific endpoints
  
  // Contract operations
  evaluateContract(contractId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/contratos/${contractId}/avaliar`, {});
  }

  getRevenueSchedule(contractId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/contratos/${contractId}/agenda`);
  }

  modifyContract(contractId: string, modification: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/contratos/${contractId}/modificar`, modification);
  }

  reprocessContract(contractId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/contratos/${contractId}/reprocessar`, {});
  }

  // Price allocation
  calculatePriceAllocation(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/price-allocation/calculate`, data);
  }

  // Revenue recognition
  calculateRevenue(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/revenue/calculate`, data);
  }

  generateRevenueSchedule(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/revenue/schedule`, data);
  }

  // Transaction price
  calculateTransactionPrice(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/transaction-price/calculate`, data);
  }

  // Performance obligations
  validatePerformanceObligation(data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/performance-obligations/validate`, data);
  }

  // Reports and analytics
  getContractAnalytics(contractId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/analytics/contract/${contractId}`);
  }

  getRevenueAnalytics(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }
    
    return this.http.get(`${this.baseUrl}/analytics/revenue`, { params: httpParams });
  }

  // Export functions
  exportContracts(params?: any): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get(`${this.baseUrl}/export/contracts`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  exportRevenue(params?: any): Observable<Blob> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get(`${this.baseUrl}/export/revenue`, {
      params: httpParams,
      responseType: 'blob'
    });
  }

  // Audit and compliance
  getAuditLogs(params?: any): Observable<any> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    return this.http.get(`${this.baseUrl}/audit/logs`, { params: httpParams });
  }

  getPolicySnapshots(contractId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/policies/snapshots/${contractId}`);
  }

  restorePolicySnapshot(snapshotId: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/policies/snapshots/${snapshotId}/restore`, {});
  }

  // Utility methods
  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  // Health check
  healthCheck(): Observable<any> {
    return this.http.get(`${this.baseUrl}/health`);
  }

  // Batch operations
  batchUpdate(endpoint: string, updates: Array<{ id: string; data: any }>): Observable<any> {
    return this.http.patch(`${this.baseUrl}/${endpoint}/batch`, { updates });
  }

  batchDelete(endpoint: string, ids: string[]): Observable<any> {
    return this.http.delete(`${this.baseUrl}/${endpoint}/batch`, { body: { ids } });
  }
}

// Specific service implementations extending the base API service

@Injectable({
  providedIn: 'root'
})
export class ContractsApiService {
  constructor(private api: ApiIntegrationService) {}

  getContracts(params?: PaginationParams) {
    return this.api.get<any>('contratos', params);
  }

  getContract(id: string) {
    return this.api.getById<any>('contratos', id);
  }

  createContract(data: any) {
    return this.api.create<any>('contratos', data);
  }

  updateContract(id: string, data: any) {
    return this.api.update<any>('contratos', id, data);
  }

  deleteContract(id: string) {
    return this.api.delete('contratos', id);
  }

  evaluateContract(id: string) {
    return this.api.evaluateContract(id);
  }

  getRevenueSchedule(id: string) {
    return this.api.getRevenueSchedule(id);
  }

  modifyContract(id: string, modification: any) {
    return this.api.modifyContract(id, modification);
  }
}

@Injectable({
  providedIn: 'root'
})
export class ClientsApiService {
  constructor(private api: ApiIntegrationService) {}

  getClients(params?: PaginationParams) {
    return this.api.get<any>('clientes', params);
  }

  getClient(id: string) {
    return this.api.getById<any>('clientes', id);
  }

  createClient(data: any) {
    return this.api.create<any>('clientes', data);
  }

  updateClient(id: string, data: any) {
    return this.api.update<any>('clientes', id, data);
  }

  deleteClient(id: string) {
    return this.api.delete('clientes', id);
  }

  exportClients(params?: any) {
    return this.api.exportContracts(params);
  }
}

@Injectable({
  providedIn: 'root'
})
export class RevenueApiService {
  constructor(private api: ApiIntegrationService) {}

  calculateRevenue(data: any) {
    return this.api.calculateRevenue(data);
  }

  generateSchedule(data: any) {
    return this.api.generateRevenueSchedule(data);
  }

  getAnalytics(params?: any) {
    return this.api.getRevenueAnalytics(params);
  }

  exportRevenue(params?: any) {
    return this.api.exportRevenue(params);
  }
}

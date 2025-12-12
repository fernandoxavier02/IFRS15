import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Get token from localStorage
    const token = localStorage.getItem('access_token');
    const tenantId = localStorage.getItem('tenant_id');

    // Clone request and add headers if token exists
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
          ...(tenantId && { 'X-Tenant-ID': tenantId })
        }
      });
    }

    // Handle the request and catch errors
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized - redirect to login
        if (error.status === 401) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('tenant_id');
          this.router.navigate(['/login']);
        }

        // Handle 403 Forbidden
        if (error.status === 403) {
          console.error('Access forbidden:', error.error?.message || 'Insufficient permissions');
        }

        // Handle 404 Not Found
        if (error.status === 404) {
          console.error('Resource not found:', error.error?.message || error.message);
        }

        // Handle 500 Internal Server Error
        if (error.status === 500) {
          console.error('Server error:', error.error?.message || 'Internal server error');
        }

        return throwError(() => error);
      })
    );
  }
}

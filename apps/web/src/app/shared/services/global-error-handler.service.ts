import { Injectable, ErrorHandler } from '@angular/core';
import { Router } from '@angular/router';

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
  timestamp?: Date;
  action?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private router: Router
  ) {}

  handleError(error: any): void {
    console.error('Global error caught:', error);

    let errorMessage = 'Ocorreu um erro inesperado';
    let errorCode = 'UNKNOWN_ERROR';

    // Parse different error types
    if (error?.error?.message) {
      errorMessage = error.error.message;
      errorCode = error.error.code || 'API_ERROR';
    } else if (error?.message) {
      errorMessage = error.message;
      errorCode = error.name || 'JS_ERROR';
    }

    // Handle specific error types
    if (error.status === 401) {
      errorMessage = 'Sessão expirada. Faça login novamente.';
      errorCode = 'UNAUTHORIZED';
      this.router.navigate(['/login']);
    } else if (error.status === 403) {
      errorMessage = 'Você não tem permissão para esta ação.';
      errorCode = 'FORBIDDEN';
    } else if (error.status === 404) {
      errorMessage = 'Recurso não encontrado.';
      errorCode = 'NOT_FOUND';
    } else if (error.status >= 500) {
      errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
      errorCode = 'SERVER_ERROR';
    }

    // Show user-friendly error message
    console.error(errorMessage);

    // Log to external service in production
    if (this.isProduction()) {
      this.logToExternalService({
        message: errorMessage,
        code: errorCode,
        details: error,
        timestamp: new Date(),
        userAgent: navigator.userAgent,
        url: window.location.href
      });
    }
  }

  private isProduction(): boolean {
    return !window.location.hostname.includes('localhost');
  }

  private logToExternalService(errorInfo: any): void {
    // Implement external logging service integration
    // Example: Sentry, LogRocket, etc.
    console.log('Logging to external service:', errorInfo);
  }
}
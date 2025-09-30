import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';
import { GlobalErrorHandler, ErrorInfo } from '../services/global-error-handler.service';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  constructor(private errorHandler: GlobalErrorHandler) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<any> {
    return next.handle(req).pipe(
      retry(1), // Retry failed requests once
      catchError((error: HttpErrorResponse) => {
        // Transform HTTP errors to user-friendly format
        const transformedError = this.transformHttpError(error);
        
        // Let global error handler deal with it
        this.errorHandler.handleError(transformedError);
        
        return throwError(transformedError);
      })
    );
  }

  private transformHttpError(error: HttpErrorResponse): ErrorInfo {
    let message = 'Erro de comunicação com o servidor';
    let code = `HTTP_${error.status}`;

    switch (error.status) {
      case 400:
        message = 'Dados inválidos enviados';
        break;
      case 401:
        message = 'Não autorizado - faça login novamente';
        break;
      case 403:
        message = 'Acesso negado - permissão insuficiente';
        break;
      case 404:
        message = 'Recurso não encontrado';
        break;
      case 422:
        message = 'Dados não puderam ser processados';
        break;
      case 429:
        message = 'Muitas requisições - tente novamente em alguns minutos';
        break;
      case 500:
        message = 'Erro interno do servidor';
        break;
      case 502:
        message = 'Servidor temporariamente indisponível';
        break;
      case 503:
        message = 'Serviço em manutenção';
        break;
      default:
        if (error.status === 0) {
          message = 'Sem conexão com a internet';
          code = 'NO_CONNECTION';
        }
    }

    return {
      message,
      code,
      details: error,
      timestamp: new Date()
    };
  }
}
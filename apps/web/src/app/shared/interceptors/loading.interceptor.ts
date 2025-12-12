import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap, finalize } from 'rxjs/operators';

export interface LoadingState {
  loading: boolean;
  requestsInProgress: number;
}

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private requestsInProgress = 0;
  private loadingSubject = new BehaviorSubject<LoadingState>({
    loading: false,
    requestsInProgress: 0
  });

  public loading$ = this.loadingSubject.asObservable();

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Increment requests count
    this.requestsInProgress++;
    this.updateLoadingState();

    const startTime = Date.now();

    return next.handle(request).pipe(
      tap({
        next: (event) => {
          if (event instanceof HttpResponse) {
            const duration = Date.now() - startTime;
            console.log(`[HTTP] ${request.method} ${request.url} - ${event.status} (${duration}ms)`);
          }
        },
        error: (error: HttpErrorResponse) => {
          const duration = Date.now() - startTime;
          console.error(`[HTTP Error] ${request.method} ${request.url} - ${error.status} (${duration}ms)`, error);
        }
      }),
      finalize(() => {
        // Decrement requests count
        this.requestsInProgress--;
        this.updateLoadingState();
      })
    );
  }

  private updateLoadingState(): void {
    this.loadingSubject.next({
      loading: this.requestsInProgress > 0,
      requestsInProgress: this.requestsInProgress
    });
  }

  public reset(): void {
    this.requestsInProgress = 0;
    this.updateLoadingState();
  }
}

// Need to import BehaviorSubject
import { BehaviorSubject } from 'rxjs';

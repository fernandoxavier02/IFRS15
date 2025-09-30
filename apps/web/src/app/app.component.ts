import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

// Angular Material imports
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';

// Error handling imports
import { ErrorHandlerComponent } from './shared/components/error-handler/error-handler.component';
import { ErrorInfo } from './shared/services/global-error-handler.service';

@Component({
  selector: 'ifrs15-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    ErrorHandlerComponent
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'IFRS 15 Revenue Recognition';
  isMenuOpen = false;
  currentRoute = '';
  private destroy$ = new Subject<void>();

  // Global error handling properties
  globalError: ErrorInfo | null = null;
  errorSeverity: 'error' | 'warning' | 'info' = 'error';
  private lastAction: (() => void) | null = null;

  constructor(private router: Router) {}

  ngOnInit(): void {
    // Track route changes for active navigation highlighting
    this.router.events
      .pipe(
        filter(event => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
        // Close mobile menu on route change
        this.isMenuOpen = false;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Toggle mobile navigation menu
   */
  toggleMobileMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  /**
   * Close mobile menu (used when clicking outside or on overlay)
   */
  closeMobileMenu(): void {
    this.isMenuOpen = false;
  }

  /**
   * Check if current route matches the given path
   */
  isActiveRoute(path: string): boolean {
    return this.currentRoute.startsWith(path);
  }

  /**
   * Handle user logout
   */
  onLogout(): void {
    // TODO: Implement logout logic
    console.log('Logout clicked');
    // Example: this.authService.logout();
    // this.router.navigate(['/login']);
  }

  /**
   * Navigate to user profile
   */
  onProfile(): void {
    // TODO: Implement profile navigation
    console.log('Profile clicked');
    // Example: this.router.navigate(['/profile']);
  }

  /**
   * Navigate to settings
   */
  onSettings(): void {
    // TODO: Implement settings navigation
    console.log('Settings clicked');
    // Example: this.router.navigate(['/settings']);
  }

  // Global Error Handling Methods

  /**
   * Show global error message
   */
  showError(error: ErrorInfo, severity: 'error' | 'warning' | 'info' = 'error'): void {
    this.globalError = error;
    this.errorSeverity = severity;
  }

  /**
   * Dismiss current error
   */
  dismissError(): void {
    this.globalError = null;
    this.lastAction = null;
  }

  /**
   * Set last action for retry functionality
   */
  setLastAction(action: () => void): void {
    this.lastAction = action;
  }

  /**
   * Retry last failed action
   */
  retryLastAction(): void {
    if (this.lastAction) {
      this.dismissError();
      this.lastAction();
    }
  }

  /**
   * Report error to external service
   */
  reportError(error: ErrorInfo): void {
    console.log('Reporting error:', error);
    // TODO: Implement error reporting to external service
    // Example: this.errorReportingService.report(error);
    
    // Show success message
    this.showError({
      message: 'Erro reportado com sucesso. Nossa equipe foi notificada.',
      code: 'ERROR_REPORTED',
      timestamp: new Date()
    }, 'info');
  }

  /**
   * Handle global application errors
   */
  handleGlobalError(error: any): void {
    let errorInfo: ErrorInfo;

    if (error?.error?.message) {
      errorInfo = {
        message: error.error.message,
        code: error.error.code || 'API_ERROR',
        details: error,
        timestamp: new Date()
      };
    } else if (error?.message) {
      errorInfo = {
        message: error.message,
        code: error.name || 'JS_ERROR',
        details: error,
        timestamp: new Date()
      };
    } else {
      errorInfo = {
        message: 'Ocorreu um erro inesperado',
        code: 'UNKNOWN_ERROR',
        details: error,
        timestamp: new Date()
      };
    }

    this.showError(errorInfo);
  }
}

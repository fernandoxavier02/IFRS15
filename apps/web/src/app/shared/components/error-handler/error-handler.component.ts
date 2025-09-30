import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface ErrorInfo {
  message: string;
  code?: string;
  details?: any;
  timestamp?: Date;
  action?: string;
}

@Component({
  selector: 'app-error-handler',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="error-container" *ngIf="error">
      <div class="error-card" [ngClass]="'error-' + severity">
        <div class="error-card-content">
          <div class="error-header">
            <span class="error-icon">{{ getErrorIcon() }}</span>
            <div class="error-title">
              <h3>{{ getErrorTitle() }}</h3>
              <span class="error-code" *ngIf="error.code">{{ error.code }}</span>
            </div>
            <button class="close-button" (click)="dismiss()">
              <span>×</span>
            </button>
          </div>
          
          <div class="error-message">
            {{ error.message }}
          </div>
          
          <div class="error-details" *ngIf="showDetails && error.details">
            <details>
              <summary>Detalhes Técnicos</summary>
              <pre>{{ error.details | json }}</pre>
            </details>
          </div>
          
          <div class="error-actions" *ngIf="showActions">
            <button class="btn btn-primary" (click)="retry()" *ngIf="retryable">
              <span>↻</span>
              Tentar Novamente
            </button>
            
            <button class="btn btn-secondary" (click)="reportError()" *ngIf="reportable">
              <span>🐛</span>
              Reportar Erro
            </button>
            
            <button class="btn btn-secondary" (click)="goBack()" *ngIf="navigable">
              <span>←</span>
              Voltar
            </button>
          </div>
          
          <div class="error-timestamp" *ngIf="error.timestamp">
            <small>{{ error.timestamp | date:'dd/MM/yyyy HH:mm:ss' }}</small>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .error-container {
      margin: 16px 0;
    }
    
    .error-card {
      border-left: 4px solid #f44336;
      background: white;
      border-radius: 4px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      
      &.error-warning {
        border-left-color: #ff9800;
      }
      
      &.error-info {
        border-left-color: #2196f3;
      }
    }

    .error-card-content {
      padding: 16px;
    }
    
    .error-header {
      display: flex;
      align-items: flex-start;
      margin-bottom: 16px;
      
      .error-icon {
        color: #f44336;
        margin-right: 12px;
        margin-top: 2px;
        font-size: 20px;
      }
      
      .error-title {
        flex: 1;
        
        h3 {
          margin: 0 0 4px 0;
          color: #f44336;
          font-size: 16px;
          font-weight: 500;
        }
        
        .error-code {
          background: #ffebee;
          color: #c62828;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }
      }
      
      .close-button {
        margin-left: auto;
        margin-top: -8px;
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 4px;
      }

      .close-button:hover {
        background: #f5f5f5;
      }
    }
    
    .error-message {
      color: #666;
      line-height: 1.5;
      margin-bottom: 16px;
    }
    
    .error-details {
      margin: 16px 0;
      
      details {
        border: 1px solid #ddd;
        border-radius: 4px;
        padding: 8px;
      }

      summary {
        cursor: pointer;
        font-weight: 500;
        padding: 4px 0;
      }
      
      pre {
        background: #f5f5f5;
        padding: 12px;
        border-radius: 4px;
        font-size: 12px;
        overflow-x: auto;
        max-height: 200px;
        margin: 8px 0 0 0;
      }
    }
    
    .error-actions {
      display: flex;
      gap: 8px;
      margin-top: 16px;
      flex-wrap: wrap;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }

    .btn-primary {
      background: #2196f3;
      color: white;
    }

    .btn-primary:hover {
      background: #1976d2;
    }

    .btn-secondary {
      background: #f5f5f5;
      color: #666;
    }

    .btn-secondary:hover {
      background: #e0e0e0;
    }
    
    .error-timestamp {
      margin-top: 16px;
      text-align: right;
      color: #999;
    }
    
    /* Severity-specific styles */
    .error-warning {
      .error-header .error-icon,
      .error-header .error-title h3 {
        color: #ff9800;
      }
      
      .error-header .error-title .error-code {
        background: #fff3e0;
        color: #e65100;
      }
    }
    
    .error-info {
      .error-header .error-icon,
      .error-header .error-title h3 {
        color: #2196f3;
      }
      
      .error-header .error-title .error-code {
        background: #e3f2fd;
        color: #0d47a1;
      }
    }
  `]
})
export class ErrorHandlerComponent {
  @Input() error: ErrorInfo | null = null;
  @Input() severity: 'error' | 'warning' | 'info' = 'error';
  @Input() showDetails: boolean = false;
  @Input() showActions: boolean = true;
  @Input() retryable: boolean = true;
  @Input() reportable: boolean = true;
  @Input() navigable: boolean = false;

  @Output() dismissed = new EventEmitter<void>();
  @Output() retried = new EventEmitter<void>();
  @Output() reported = new EventEmitter<ErrorInfo>();
  @Output() navigated = new EventEmitter<void>();

  getErrorIcon(): string {
    switch (this.severity) {
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '❌';
    }
  }

  getErrorTitle(): string {
    switch (this.severity) {
      case 'warning': return 'Atenção';
      case 'info': return 'Informação';
      default: return 'Erro';
    }
  }

  dismiss(): void {
    this.dismissed.emit();
  }

  retry(): void {
    this.retried.emit();
  }

  reportError(): void {
    this.reported.emit(this.error!);
  }

  goBack(): void {
    this.navigated.emit();
  }
}

import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBarRef, MAT_SNACK_BAR_DATA } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface NotificationData {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  action?: string;
  duration?: number;
  showClose?: boolean;
}

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  template: `
    <div class="notification" [ngClass]="'notification-' + data.type">
      <div class="notification-content">
        <mat-icon class="notification-icon">{{ getIcon() }}</mat-icon>
        <span class="notification-message">{{ data.message }}</span>
      </div>
      
      <div class="notification-actions">
        <button 
          *ngIf="data.action"
          mat-button 
          class="action-button"
          (click)="onAction()">
          {{ data.action }}
        </button>
        
        <button 
          *ngIf="data.showClose !== false"
          mat-icon-button 
          class="close-button"
          (click)="dismiss()"
          aria-label="Fechar">
          <mat-icon>close</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .notification {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-radius: 4px;
      min-width: 300px;
      max-width: 500px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
    }

    .notification-content {
      display: flex;
      align-items: center;
      gap: 12px;
      flex: 1;
    }

    .notification-icon {
      font-size: 20px;
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .notification-message {
      font-size: 14px;
      line-height: 1.4;
      word-break: break-word;
    }

    .notification-actions {
      display: flex;
      align-items: center;
      gap: 4px;
      margin-left: 12px;
    }

    .action-button {
      font-size: 12px;
      font-weight: 500;
      text-transform: uppercase;
      min-width: auto;
      padding: 0 8px;
      height: 32px;
    }

    .close-button {
      width: 32px;
      height: 32px;
      line-height: 32px;
    }

    .close-button mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    /* Success notification */
    .notification-success {
      background-color: #4caf50;
      color: white;
    }

    .notification-success .notification-icon {
      color: white;
    }

    .notification-success .action-button {
      color: white;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .notification-success .action-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .notification-success .close-button {
      color: white;
    }

    /* Error notification */
    .notification-error {
      background-color: #f44336;
      color: white;
    }

    .notification-error .notification-icon {
      color: white;
    }

    .notification-error .action-button {
      color: white;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .notification-error .action-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .notification-error .close-button {
      color: white;
    }

    /* Warning notification */
    .notification-warning {
      background-color: #ff9800;
      color: white;
    }

    .notification-warning .notification-icon {
      color: white;
    }

    .notification-warning .action-button {
      color: white;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .notification-warning .action-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .notification-warning .close-button {
      color: white;
    }

    /* Info notification */
    .notification-info {
      background-color: #2196f3;
      color: white;
    }

    .notification-info .notification-icon {
      color: white;
    }

    .notification-info .action-button {
      color: white;
      border-color: rgba(255, 255, 255, 0.3);
    }

    .notification-info .action-button:hover {
      background-color: rgba(255, 255, 255, 0.1);
    }

    .notification-info .close-button {
      color: white;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .notification {
        min-width: 280px;
        max-width: 90vw;
        padding: 10px 12px;
      }

      .notification-message {
        font-size: 13px;
      }

      .action-button {
        font-size: 11px;
        padding: 0 6px;
        height: 28px;
      }

      .close-button {
        width: 28px;
        height: 28px;
      }
    }
  `]
})
export class NotificationComponent {
  constructor(
    public snackBarRef: MatSnackBarRef<NotificationComponent>,
    @Inject(MAT_SNACK_BAR_DATA) public data: NotificationData
  ) {}

  getIcon(): string {
    switch (this.data.type) {
      case 'success':
        return 'check_circle';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'info';
    }
  }

  onAction(): void {
    this.snackBarRef.dismissWithAction();
  }

  dismiss(): void {
    this.snackBarRef.dismiss();
  }
}
import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface ConfirmationDialogData {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'warning' | 'danger' | 'info' | 'success';
  icon?: string;
  details?: string;
  showCancel?: boolean;
}

@Component({
  selector: 'app-confirmation-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="confirmation-dialog" [ngClass]="'type-' + data.type">
      <div class="dialog-header">
        <mat-icon *ngIf="data.icon" class="dialog-icon">{{ data.icon }}</mat-icon>
        <h2 mat-dialog-title>{{ data.title }}</h2>
      </div>
      
      <mat-dialog-content class="dialog-content">
        <p class="dialog-message">{{ data.message }}</p>
        <div *ngIf="data.details" class="dialog-details">
          <p>{{ data.details }}</p>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions class="dialog-actions">
        <button 
          *ngIf="data.showCancel !== false"
          mat-button 
          (click)="onCancel()"
          class="cancel-button">
          {{ data.cancelText || 'Cancelar' }}
        </button>
        <button 
          mat-raised-button 
          [color]="getConfirmButtonColor()"
          (click)="onConfirm()"
          class="confirm-button">
          {{ data.confirmText || 'Confirmar' }}
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .confirmation-dialog {
      min-width: 320px;
      max-width: 500px;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .dialog-icon {
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .type-warning .dialog-icon {
      color: #ff9800;
    }

    .type-danger .dialog-icon {
      color: #f44336;
    }

    .type-info .dialog-icon {
      color: #2196f3;
    }

    .type-success .dialog-icon {
      color: #4caf50;
    }

    h2[mat-dialog-title] {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }

    .dialog-content {
      margin-bottom: 24px;
    }

    .dialog-message {
      margin: 0 0 16px 0;
      font-size: 16px;
      line-height: 1.5;
      color: rgba(0, 0, 0, 0.87);
    }

    .dialog-details {
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
      border-left: 4px solid #ddd;
    }

    .type-warning .dialog-details {
      background: #fff3e0;
      border-left-color: #ff9800;
    }

    .type-danger .dialog-details {
      background: #ffebee;
      border-left-color: #f44336;
    }

    .type-info .dialog-details {
      background: #e3f2fd;
      border-left-color: #2196f3;
    }

    .type-success .dialog-details {
      background: #e8f5e8;
      border-left-color: #4caf50;
    }

    .dialog-details p {
      margin: 0;
      font-size: 14px;
      color: rgba(0, 0, 0, 0.6);
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin: 0;
      padding: 0;
    }

    .cancel-button {
      color: rgba(0, 0, 0, 0.6);
    }

    .confirm-button {
      min-width: 80px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      .confirmation-dialog {
        min-width: 280px;
      }

      .dialog-actions {
        flex-direction: column-reverse;
        gap: 8px;
      }

      .cancel-button,
      .confirm-button {
        width: 100%;
      }
    }
  `]
})
export class ConfirmationDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ConfirmationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogData
  ) {
    // Set default values
    this.data = {
      type: 'info',
      icon: this.getDefaultIcon(),
      showCancel: true,
      ...data
    };
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getConfirmButtonColor(): string {
    switch (this.data.type) {
      case 'danger':
        return 'warn';
      case 'success':
        return 'primary';
      case 'warning':
        return 'accent';
      default:
        return 'primary';
    }
  }

  private getDefaultIcon(): string {
    switch (this.data.type) {
      case 'warning':
        return 'warning';
      case 'danger':
        return 'error';
      case 'success':
        return 'check_circle';
      case 'info':
      default:
        return 'info';
    }
  }
}
import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-loading',
  standalone: true,
  imports: [CommonModule, MatProgressSpinnerModule, MatProgressBarModule],
  template: `
    <div class="loading-container" [ngClass]="containerClass">
      <!-- Spinner Loading -->
      <div *ngIf="type === 'spinner'" class="loading-spinner">
        <mat-spinner 
          [diameter]="size" 
          [strokeWidth]="strokeWidth"
          [color]="color">
        </mat-spinner>
        <p *ngIf="message" class="loading-message">{{ message }}</p>
      </div>

      <!-- Progress Bar Loading -->
      <div *ngIf="type === 'progress'" class="loading-progress">
        <p *ngIf="message" class="loading-message">{{ message }}</p>
        <mat-progress-bar 
          [mode]="progressMode" 
          [value]="value"
          [color]="color">
        </mat-progress-bar>
        <span *ngIf="showPercentage && value !== undefined" class="progress-percentage">
          {{ value }}%
        </span>
      </div>

      <!-- Dots Loading -->
      <div *ngIf="type === 'dots'" class="loading-dots">
        <p *ngIf="message" class="loading-message">{{ message }}</p>
        <div class="dots-container">
          <div class="dot" [style.animation-delay]="'0s'"></div>
          <div class="dot" [style.animation-delay]="'0.2s'"></div>
          <div class="dot" [style.animation-delay]="'0.4s'"></div>
        </div>
      </div>

      <!-- Skeleton Loading -->
      <div *ngIf="type === 'skeleton'" class="loading-skeleton">
        <div class="skeleton-line" *ngFor="let line of skeletonLines"></div>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }

    .loading-container.overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(255, 255, 255, 0.8);
      z-index: 9999;
    }

    .loading-container.inline {
      position: relative;
      min-height: 100px;
    }

    .loading-container.compact {
      padding: 10px;
      min-height: 60px;
    }

    .loading-spinner,
    .loading-progress,
    .loading-dots {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 16px;
    }

    .loading-message {
      margin: 0;
      color: #666;
      font-size: 14px;
      text-align: center;
      max-width: 300px;
    }

    /* Progress Bar Styles */
    .loading-progress {
      width: 100%;
      max-width: 300px;
    }

    .progress-percentage {
      font-size: 12px;
      color: #666;
      margin-top: 4px;
    }

    /* Dots Animation */
    .dots-container {
      display: flex;
      gap: 4px;
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--primary-color, #2196f3);
      animation: dotPulse 1.4s infinite ease-in-out;
    }

    @keyframes dotPulse {
      0%, 80%, 100% {
        transform: scale(0.8);
        opacity: 0.5;
      }
      40% {
        transform: scale(1);
        opacity: 1;
      }
    }

    /* Skeleton Loading */
    .loading-skeleton {
      width: 100%;
      max-width: 400px;
    }

    .skeleton-line {
      height: 16px;
      background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
      background-size: 200% 100%;
      animation: skeletonLoading 1.5s infinite;
      margin-bottom: 8px;
      border-radius: 4px;
    }

    .skeleton-line:nth-child(1) { width: 100%; }
    .skeleton-line:nth-child(2) { width: 80%; }
    .skeleton-line:nth-child(3) { width: 60%; }
    .skeleton-line:nth-child(4) { width: 90%; }

    @keyframes skeletonLoading {
      0% {
        background-position: -200% 0;
      }
      100% {
        background-position: 200% 0;
      }
    }

    /* Responsive */
    @media (max-width: 768px) {
      .loading-container {
        padding: 16px;
      }
      
      .loading-message {
        font-size: 13px;
      }
    }
  `]
})
export class LoadingComponent {
  @Input() type: 'spinner' | 'progress' | 'dots' | 'skeleton' = 'spinner';
  @Input() message: string = '';
  @Input() size: number = 40;
  @Input() strokeWidth: number = 4;
  @Input() color: 'primary' | 'accent' | 'warn' = 'primary';
  @Input() containerClass: string = 'inline';
  @Input() progressMode: 'determinate' | 'indeterminate' = 'indeterminate';
  @Input() value?: number;
  @Input() showPercentage: boolean = false;
  @Input() skeletonLines: number[] = [1, 2, 3, 4];
  
  // Backward compatibility
  @Input() set overlay(value: boolean) {
    this.containerClass = value ? 'overlay' : 'inline';
  }
}

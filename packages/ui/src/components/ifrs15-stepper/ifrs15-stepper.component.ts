import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatStepperModule } from '@angular/material/stepper';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

export interface IFRS15Step {
  stepNumber: number;
  title: string;
  description: string;
  completed: boolean;
  active: boolean;
  data?: any;
}

@Component({
  selector: 'ifrs15-stepper',
  standalone: true,
  imports: [
    CommonModule,
    MatStepperModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule
  ],
  template: `
    <div class="ifrs15-stepper">
      <mat-stepper [linear]="linear" [orientation]="orientation" #stepper>
        <mat-step 
          *ngFor="let step of steps; trackBy: trackByStep"
          [completed]="step.completed"
          [editable]="!linear">
          <ng-template matStepLabel>
            <div class="step-label">
              <span class="step-number">{{ step.stepNumber }}</span>
              <span class="step-title">{{ step.title }}</span>
            </div>
          </ng-template>
          
          <div class="step-content">
            <mat-card>
              <mat-card-header>
                <mat-card-title>
                  Passo {{ step.stepNumber }}: {{ step.title }}
                </mat-card-title>
                <mat-card-subtitle>{{ step.description }}</mat-card-subtitle>
              </mat-card-header>
              
              <mat-card-content>
                <ng-content [select]="'[slot=step-' + step.stepNumber + ']'"></ng-content>
                
                <!-- Default content if no slot provided -->
                <div *ngIf="!hasSlotContent(step.stepNumber)" class="default-content">
                  <p>{{ step.description }}</p>
                  <div *ngIf="step.data" class="step-data">
                    <pre>{{ step.data | json }}</pre>
                  </div>
                </div>
              </mat-card-content>
              
              <mat-card-actions align="end">
                <button 
                  mat-button 
                  matStepperPrevious 
                  *ngIf="!isFirstStep(step.stepNumber)">
                  <mat-icon>arrow_back</mat-icon>
                  Anterior
                </button>
                
                <button 
                  mat-raised-button 
                  color="primary"
                  (click)="onStepAction(step)"
                  [disabled]="loading">
                  <mat-icon *ngIf="loading">hourglass_empty</mat-icon>
                  <mat-icon *ngIf="!loading && !isLastStep(step.stepNumber)">arrow_forward</mat-icon>
                  <mat-icon *ngIf="!loading && isLastStep(step.stepNumber)">check</mat-icon>
                  {{ getStepActionLabel(step) }}
                </button>
              </mat-card-actions>
            </mat-card>
          </div>
        </mat-step>
      </mat-stepper>
      
      <!-- Progress indicator -->
      <div class="progress-indicator" *ngIf="showProgress">
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            [style.width.%]="progressPercentage">
          </div>
        </div>
        <div class="progress-text">
          {{ completedSteps }} de {{ totalSteps }} passos concluídos
        </div>
      </div>
    </div>
  `,
  styles: [`
    .ifrs15-stepper {
      width: 100%;
    }

    .step-label {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .step-number {
      background: #3f51b5;
      color: white;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 12px;
      font-weight: bold;
    }

    .step-title {
      font-weight: 500;
    }

    .step-content {
      margin: 16px 0;
    }

    .default-content {
      padding: 16px 0;
    }

    .step-data {
      background: #f5f5f5;
      padding: 12px;
      border-radius: 4px;
      margin-top: 12px;
      font-size: 12px;
    }

    .progress-indicator {
      margin-top: 24px;
      padding: 16px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .progress-bar {
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #4caf50, #66bb6a);
      transition: width 0.3s ease;
    }

    .progress-text {
      text-align: center;
      font-size: 14px;
      color: #666;
      font-weight: 500;
    }

    ::ng-deep .mat-stepper-horizontal {
      margin-top: 8px;
    }

    ::ng-deep .mat-step-header {
      pointer-events: auto;
    }

    ::ng-deep .mat-step-header:hover {
      background-color: rgba(0, 0, 0, 0.04);
    }
  `]
})
export class IFRS15StepperComponent {
  @Input() steps: IFRS15Step[] = [];
  @Input() linear = true;
  @Input() orientation: 'horizontal' | 'vertical' = 'horizontal';
  @Input() showProgress = true;
  @Input() loading = false;

  @Output() stepChange = new EventEmitter<IFRS15Step>();
  @Output() stepComplete = new EventEmitter<IFRS15Step>();
  @Output() allStepsComplete = new EventEmitter<IFRS15Step[]>();

  trackByStep(index: number, step: IFRS15Step): number {
    return step.stepNumber;
  }

  hasSlotContent(stepNumber: number): boolean {
    // This would need to be implemented based on content projection
    // For now, return false to show default content
    return false;
  }

  isFirstStep(stepNumber: number): boolean {
    return stepNumber === 1;
  }

  isLastStep(stepNumber: number): boolean {
    return stepNumber === this.steps.length;
  }

  getStepActionLabel(step: IFRS15Step): string {
    if (this.loading) return 'Processando...';
    if (step.completed) return 'Revisitar';
    if (this.isLastStep(step.stepNumber)) return 'Finalizar';
    return 'Próximo';
  }

  onStepAction(step: IFRS15Step) {
    if (!step.completed) {
      step.completed = true;
      this.stepComplete.emit(step);
    }

    this.stepChange.emit(step);

    // Check if all steps are completed
    if (this.steps.every(s => s.completed)) {
      this.allStepsComplete.emit(this.steps);
    }
  }

  get completedSteps(): number {
    return this.steps.filter(step => step.completed).length;
  }

  get totalSteps(): number {
    return this.steps.length;
  }

  get progressPercentage(): number {
    return (this.completedSteps / this.totalSteps) * 100;
  }

  // Public methods for external control
  goToStep(stepNumber: number) {
    const stepIndex = stepNumber - 1;
    if (stepIndex >= 0 && stepIndex < this.steps.length) {
      // This would require ViewChild reference to stepper
      // stepper.selectedIndex = stepIndex;
    }
  }

  markStepComplete(stepNumber: number, data?: any) {
    const step = this.steps.find(s => s.stepNumber === stepNumber);
    if (step) {
      step.completed = true;
      if (data) {
        step.data = data;
      }
    }
  }

  resetStepper() {
    this.steps.forEach(step => {
      step.completed = false;
      step.active = false;
      step.data = undefined;
    });
    if (this.steps.length > 0) {
      this.steps[0].active = true;
    }
  }
}

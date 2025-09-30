import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';

export interface FormFieldConfig {
  key: string;
  type: 'text' | 'email' | 'number' | 'date' | 'select' | 'checkbox' | 'radio' | 'textarea';
  label: string;
  placeholder?: string;
  required?: boolean;
  validators?: any[];
  options?: { value: any; label: string }[];
  disabled?: boolean;
  readonly?: boolean;
  hint?: string;
  errorMessages?: { [key: string]: string };
}

@Component({
  selector: 'ifrs15-form-builder',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatButtonModule,
    MatCheckboxModule,
    MatRadioModule
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()" class="form-builder">
      <div class="form-fields">
        <ng-container *ngFor="let field of fields">
          <!-- Text, Email, Number inputs -->
          <mat-form-field 
            *ngIf="field.type === 'text' || field.type === 'email' || field.type === 'number'"
            appearance="outline"
            class="form-field">
            <mat-label>{{ field.label }}</mat-label>
            <input 
              matInput
              [type]="field.type"
              [formControlName]="field.key"
              [placeholder]="field.placeholder || ''"
              [readonly]="field.readonly">
            <mat-hint *ngIf="field.hint">{{ field.hint }}</mat-hint>
            <mat-error *ngIf="form.get(field.key)?.errors && form.get(field.key)?.touched">
              {{ getErrorMessage(field) }}
            </mat-error>
          </mat-form-field>

          <!-- Textarea -->
          <mat-form-field 
            *ngIf="field.type === 'textarea'"
            appearance="outline"
            class="form-field">
            <mat-label>{{ field.label }}</mat-label>
            <textarea 
              matInput
              [formControlName]="field.key"
              [placeholder]="field.placeholder || ''"
              [readonly]="field.readonly"
              rows="4">
            </textarea>
            <mat-hint *ngIf="field.hint">{{ field.hint }}</mat-hint>
            <mat-error *ngIf="form.get(field.key)?.errors && form.get(field.key)?.touched">
              {{ getErrorMessage(field) }}
            </mat-error>
          </mat-form-field>

          <!-- Date picker -->
          <mat-form-field 
            *ngIf="field.type === 'date'"
            appearance="outline"
            class="form-field">
            <mat-label>{{ field.label }}</mat-label>
            <input 
              matInput
              [matDatepicker]="picker"
              [formControlName]="field.key"
              [readonly]="field.readonly">
            <mat-datepicker-toggle matIconSuffix [for]="picker"></mat-datepicker-toggle>
            <mat-datepicker #picker></mat-datepicker>
            <mat-hint *ngIf="field.hint">{{ field.hint }}</mat-hint>
            <mat-error *ngIf="form.get(field.key)?.errors && form.get(field.key)?.touched">
              {{ getErrorMessage(field) }}
            </mat-error>
          </mat-form-field>

          <!-- Select -->
          <mat-form-field 
            *ngIf="field.type === 'select'"
            appearance="outline"
            class="form-field">
            <mat-label>{{ field.label }}</mat-label>
            <mat-select [formControlName]="field.key">
              <mat-option *ngFor="let option of field.options" [value]="option.value">
                {{ option.label }}
              </mat-option>
            </mat-select>
            <mat-hint *ngIf="field.hint">{{ field.hint }}</mat-hint>
            <mat-error *ngIf="form.get(field.key)?.errors && form.get(field.key)?.touched">
              {{ getErrorMessage(field) }}
            </mat-error>
          </mat-form-field>

          <!-- Checkbox -->
          <div *ngIf="field.type === 'checkbox'" class="form-field checkbox-field">
            <mat-checkbox [formControlName]="field.key">
              {{ field.label }}
            </mat-checkbox>
            <div *ngIf="field.hint" class="field-hint">{{ field.hint }}</div>
          </div>

          <!-- Radio group -->
          <div *ngIf="field.type === 'radio'" class="form-field radio-field">
            <label class="field-label">{{ field.label }}</label>
            <mat-radio-group [formControlName]="field.key" class="radio-group">
              <mat-radio-button 
                *ngFor="let option of field.options" 
                [value]="option.value"
                class="radio-option">
                {{ option.label }}
              </mat-radio-button>
            </mat-radio-group>
            <div *ngIf="field.hint" class="field-hint">{{ field.hint }}</div>
          </div>
        </ng-container>
      </div>

      <div class="form-actions" *ngIf="showActions">
        <button 
          mat-button 
          type="button" 
          (click)="onCancel()"
          [disabled]="loading">
          {{ cancelLabel }}
        </button>
        <button 
          mat-raised-button 
          color="primary" 
          type="submit"
          [disabled]="form.invalid || loading">
          {{ submitLabel }}
        </button>
      </div>
    </form>
  `,
  styles: [`
    .form-builder {
      width: 100%;
    }

    .form-fields {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .form-field {
      width: 100%;
    }

    .checkbox-field,
    .radio-field {
      padding: 8px 0;
    }

    .field-label {
      display: block;
      font-weight: 500;
      margin-bottom: 8px;
      color: rgba(0, 0, 0, 0.87);
    }

    .radio-group {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .radio-option {
      margin-bottom: 8px;
    }

    .field-hint {
      font-size: 12px;
      color: rgba(0, 0, 0, 0.6);
      margin-top: 4px;
    }

    .form-actions {
      display: flex;
      justify-content: flex-end;
      gap: 16px;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid rgba(0, 0, 0, 0.12);
    }
  `]
})
export class FormBuilderComponent implements OnInit {
  @Input() fields: FormFieldConfig[] = [];
  @Input() initialData: any = {};
  @Input() showActions = true;
  @Input() submitLabel = 'Salvar';
  @Input() cancelLabel = 'Cancelar';
  @Input() loading = false;

  @Output() formSubmit = new EventEmitter<any>();
  @Output() formCancel = new EventEmitter<void>();
  @Output() formChange = new EventEmitter<any>();

  form!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.buildForm();
  }

  private buildForm() {
    const formConfig: any = {};

    this.fields.forEach(field => {
      const validators = [];
      
      if (field.required) {
        validators.push(Validators.required);
      }

      if (field.type === 'email') {
        validators.push(Validators.email);
      }

      if (field.validators) {
        validators.push(...field.validators);
      }

      const initialValue = this.initialData[field.key] || 
        (field.type === 'checkbox' ? false : '');

      formConfig[field.key] = [
        { value: initialValue, disabled: field.disabled },
        validators
      ];
    });

    this.form = this.fb.group(formConfig);

    // Emit form changes
    this.form.valueChanges.subscribe(value => {
      this.formChange.emit(value);
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.formSubmit.emit(this.form.value);
    }
  }

  onCancel() {
    this.formCancel.emit();
  }

  getErrorMessage(field: FormFieldConfig): string {
    const control = this.form.get(field.key);
    if (!control || !control.errors) return '';

    const errors = control.errors;
    
    if (field.errorMessages) {
      for (const errorKey in errors) {
        if (field.errorMessages[errorKey]) {
          return field.errorMessages[errorKey];
        }
      }
    }

    // Default error messages
    if (errors['required']) return `${field.label} é obrigatório`;
    if (errors['email']) return 'Email inválido';
    if (errors['min']) return `Valor mínimo: ${errors['min'].min}`;
    if (errors['max']) return `Valor máximo: ${errors['max'].max}`;
    if (errors['minlength']) return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `Máximo ${errors['maxlength'].requiredLength} caracteres`;

    return 'Campo inválido';
  }

  // Public methods for external control
  patchValue(data: any) {
    this.form.patchValue(data);
  }

  reset() {
    this.form.reset();
  }

  markAllAsTouched() {
    this.form.markAllAsTouched();
  }

  get formValue() {
    return this.form.value;
  }

  get formValid() {
    return this.form.valid;
  }
}

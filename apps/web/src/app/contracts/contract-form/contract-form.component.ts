import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { ContractsApiService } from '../../shared/services/api.service';

export interface PerformanceObligation {
  id?: string;
  descricao: string;
  valor: number;
  metodoReconhecimento: string;
  dataInicio: Date;
  dataFim: Date;
  progresso: number;
}

@Component({
  selector: 'app-contract-form',
  standalone: true,
  imports: [
    CommonModule, 
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    MatDividerModule,
    MatChipsModule
  ],
  templateUrl: './contract-form.component.html',
  styleUrls: ['./contract-form.component.scss']
})
export class ContractFormComponent implements OnInit {
  contractForm!: FormGroup;
  loading = false;
  isEditMode = false;

  reconhecimentoMethods = [
    { value: 'point_in_time', label: 'Ponto no Tempo' },
    { value: 'over_time_output', label: 'Ao Longo do Tempo - Output' },
    { value: 'over_time_input', label: 'Ao Longo do Tempo - Input' },
    { value: 'over_time_time_elapsed', label: 'Ao Longo do Tempo - Tempo Decorrido' }
  ];

  statusOptions = [
    { value: 'draft', label: 'Rascunho' },
    { value: 'active', label: 'Ativo' },
    { value: 'completed', label: 'Concluído' },
    { value: 'cancelled', label: 'Cancelado' }
  ];

  constructor(
    private fb: FormBuilder,
    private contractsApi: ContractsApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.isEditMode = this.route.snapshot.url.some(segment => segment.path === 'edit');
  }

  ngOnInit(): void {
    this.initializeForm();
    
    const contractId = this.route.snapshot.paramMap.get('id');
    if (this.isEditMode && contractId) {
      this.loadContractById(contractId);
    }
  }

  initializeForm(): void {
    this.contractForm = this.fb.group({
      numero: ['', [Validators.required, Validators.minLength(3)]],
      cliente: ['', [Validators.required, Validators.minLength(2)]],
      descricao: ['', Validators.required],
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required],
      valor: ['', [Validators.required, Validators.min(0.01)]],
      status: ['draft', Validators.required],
      moeda: ['BRL', Validators.required],
      observacoes: [''],
      performanceObligations: this.fb.array([])
    });

    // Add initial PO
    this.addPerformanceObligation();
  }

  get performanceObligations(): FormArray {
    return this.contractForm.get('performanceObligations') as FormArray;
  }

  createPerformanceObligationForm(po?: PerformanceObligation): FormGroup {
    return this.fb.group({
      id: [po?.id || ''],
      descricao: [po?.descricao || '', [Validators.required, Validators.minLength(3)]],
      valor: [po?.valor || '', [Validators.required, Validators.min(0.01)]],
      metodoReconhecimento: [po?.metodoReconhecimento || 'over_time_output', Validators.required],
      dataInicio: [po?.dataInicio || '', Validators.required],
      dataFim: [po?.dataFim || '', Validators.required],
      progresso: [po?.progresso || 0, [Validators.min(0), Validators.max(100)]]
    });
  }

  addPerformanceObligation(): void {
    this.performanceObligations.push(this.createPerformanceObligationForm());
  }

  removePerformanceObligation(index: number): void {
    if (this.performanceObligations.length > 1) {
      this.performanceObligations.removeAt(index);
    }
  }

  loadContractById(contractId: string): void {
    // Simulate loading contract data by ID
    // In a real app, this would call the API service
    const mockContract = {
      numero: 'CTR-2024-001',
      cliente: 'Empresa ABC Ltda',
      descricao: 'Contrato de prestação de serviços',
      dataInicio: new Date('2024-01-01'),
      dataFim: new Date('2024-12-31'),
      valor: 50000,
      status: 'active',
      moeda: 'BRL',
      observacoes: 'Contrato de exemplo'
    };

    this.contractForm.patchValue({
      numero: mockContract.numero,
      cliente: mockContract.cliente,
      descricao: mockContract.descricao,
      dataInicio: mockContract.dataInicio,
      dataFim: mockContract.dataFim,
      valor: mockContract.valor,
      status: mockContract.status,
      moeda: mockContract.moeda,
      observacoes: mockContract.observacoes
    });

    // Clear existing POs and add default one
    this.performanceObligations.clear();
    this.addPerformanceObligation();
  }

  onSubmit(): void {
    if (this.contractForm.valid) {
      this.loading = true;
      const formData = this.contractForm.value;
      const contractId = this.route.snapshot.paramMap.get('id');

      const apiCall = this.isEditMode && contractId
        ? this.contractsApi.updateContract(contractId, formData)
        : this.contractsApi.createContract(formData);

      apiCall.subscribe({
        next: (result) => {
          console.log(this.isEditMode ? 'Contrato atualizado com sucesso!' : 'Contrato criado com sucesso!');
          this.goBack();
        },
        error: (error) => {
          console.error(`Erro ao ${this.isEditMode ? 'atualizar' : 'criar'} contrato:`, error.message);
          this.loading = false;
        }
      });
    } else {
      this.markFormGroupTouched(this.contractForm);
    }
  }

  onCancel(): void {
    this.goBack();
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      } else if (control instanceof FormArray) {
        control.controls.forEach(arrayControl => {
          if (arrayControl instanceof FormGroup) {
            this.markFormGroupTouched(arrayControl);
          }
        });
      }
    });
  }

  getErrorMessage(fieldName: string, formGroup?: FormGroup): string {
    const control = (formGroup || this.contractForm).get(fieldName);
    
    if (control?.hasError('required')) {
      return 'Este campo é obrigatório';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo de ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `Valor deve ser maior que ${control.errors?.['min'].min}`;
    }
    if (control?.hasError('max')) {
      return `Valor deve ser menor que ${control.errors?.['max'].max}`;
    }
    
    return '';
  }

  getTotalPOValue(): number {
    return this.performanceObligations.controls.reduce((total, control) => {
      const valor = control.get('valor')?.value || 0;
      return total + Number(valor);
    }, 0);
  }

  isValueMismatch(): boolean {
    const contractValue = this.contractForm.get('valor')?.value || 0;
    const totalPOValue = this.getTotalPOValue();
    return Math.abs(contractValue - totalPOValue) > 0.01;
  }

  goBack(): void {
    this.router.navigate(['/contracts']);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { ClientsApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-client-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="client-form-container">
      <div class="form-header">
        <h1>{{ isEditMode ? 'Editar Cliente' : 'Novo Cliente' }}</h1>
        <button class="btn btn-secondary" (click)="goBack()">
          ← Voltar
        </button>
      </div>

      <div class="form-card">
        <form [formGroup]="clientForm" (ngSubmit)="onSubmit()">
          <div class="form-row">
            <div class="form-field">
              <label for="nome">Nome *</label>
              <input 
                id="nome"
                type="text" 
                formControlName="nome" 
                placeholder="Nome completo do cliente">
              <div class="error-message" *ngIf="clientForm.get('nome')?.errors && clientForm.get('nome')?.touched">
                Nome é obrigatório
              </div>
            </div>

            <div class="form-field">
              <label for="documento">Documento *</label>
              <input 
                id="documento"
                type="text" 
                formControlName="documento" 
                placeholder="CPF ou CNPJ">
              <div class="error-message" *ngIf="clientForm.get('documento')?.errors && clientForm.get('documento')?.touched">
                Documento é obrigatório
              </div>
            </div>
          </div>

          <div class="form-row">
            <div class="form-field">
              <label for="email">Email *</label>
              <input 
                id="email"
                type="email" 
                formControlName="email" 
                placeholder="email@exemplo.com">
              <div class="error-message" *ngIf="clientForm.get('email')?.errors && clientForm.get('email')?.touched">
                Email válido é obrigatório
              </div>
            </div>

            <div class="form-field">
              <label for="telefone">Telefone</label>
              <input 
                id="telefone"
                type="tel" 
                formControlName="telefone" 
                placeholder="(11) 99999-9999">
            </div>
          </div>

          <div class="form-field">
            <label for="endereco">Endereço</label>
            <textarea 
              id="endereco"
              formControlName="endereco" 
              rows="3"
              placeholder="Endereço completo do cliente"></textarea>
          </div>

          <div class="form-field">
            <label for="status">Status</label>
            <select id="status" formControlName="status">
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="suspenso">Suspenso</option>
            </select>
          </div>

          <div class="form-actions">
            <button type="button" class="btn btn-secondary" (click)="goBack()">
              Cancelar
            </button>
            <button type="submit" class="btn btn-primary" [disabled]="clientForm.invalid || loading">
              {{ loading ? 'Salvando...' : (isEditMode ? 'Atualizar' : 'Criar Cliente') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .client-form-container {
      padding: 20px;
      max-width: 800px;
      margin: 0 auto;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .form-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 24px;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 16px;
    }

    .form-field {
      margin-bottom: 16px;
    }

    .form-field label {
      display: block;
      margin-bottom: 4px;
      font-weight: 500;
      color: #333;
    }

    .form-field input,
    .form-field select,
    .form-field textarea {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #ddd;
      border-radius: 4px;
      font-size: 14px;
    }

    .form-field input:focus,
    .form-field select:focus,
    .form-field textarea:focus {
      outline: none;
      border-color: #1976d2;
      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.2);
    }

    .error-message {
      color: #f44336;
      font-size: 12px;
      margin-top: 4px;
    }

    .form-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #eee;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
    }

    .btn-primary {
      background-color: #1976d2;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: #1565c0;
    }

    .btn-primary:disabled {
      background-color: #ccc;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: #f5f5f5;
      color: #333;
      border: 1px solid #ddd;
    }

    .btn-secondary:hover {
      background-color: #e0e0e0;
    }

    @media (max-width: 768px) {
      .form-row {
        grid-template-columns: 1fr;
      }
      
      .form-header {
        flex-direction: column;
        gap: 12px;
        align-items: flex-start;
      }
    }
  `]
})
export class ClientFormComponent implements OnInit {
  clientForm: FormGroup;
  isEditMode = false;
  loading = false;
  clientId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private apiService: ClientsApiService
  ) {
    this.clientForm = this.fb.group({
      nome: ['', [Validators.required]],
      documento: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      telefone: [''],
      endereco: [''],
      status: ['ativo']
    });
  }

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.clientId;

    if (this.isEditMode) {
      this.loadClient();
    }
  }

  loadClient(): void {
    if (!this.clientId) return;

    this.loading = true;
    // Simulando carregamento de dados do cliente
    setTimeout(() => {
      const mockClient = {
        id: this.clientId,
        nome: 'Cliente Exemplo',
        documento: '12345678901',
        email: 'cliente@exemplo.com',
        telefone: '(11) 99999-9999',
        endereco: 'Rua Exemplo, 123',
        status: 'ativo'
      };

      this.clientForm.patchValue(mockClient);
      this.loading = false;
    }, 1000);
  }

  onSubmit(): void {
    if (this.clientForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.loading = true;
    const formData = this.clientForm.value;

    // Simulando salvamento
    setTimeout(() => {
      console.log(this.isEditMode ? 'Cliente atualizado:' : 'Cliente criado:', formData);
      this.loading = false;
      this.goBack();
    }, 1500);
  }

  goBack(): void {
    this.router.navigate(['/clients']);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.clientForm.controls).forEach(key => {
      const control = this.clientForm.get(key);
      control?.markAsTouched();
    });
  }
}
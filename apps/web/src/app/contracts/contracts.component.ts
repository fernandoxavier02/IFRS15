import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'ifrs15-contracts',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="contracts-container">
      <div class="header">
        <h1>Contratos</h1>
        <button class="btn btn-primary" (click)="addContract()">
          <span>➕</span>
          Novo Contrato
        </button>
      </div>

      <div class="contracts-card">
        <div class="card-content">
          <table class="contracts-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Data Início</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let contract of contracts">
                <td>{{ contract.id }}</td>
                <td>{{ contract.customer }}</td>
                <td>{{ contract.value | currency:'BRL' }}</td>
                <td>
                  <span class="status-chip" [ngClass]="'status-' + contract.status">
                    {{ getStatusLabel(contract.status) }}
                  </span>
                </td>
                <td>{{ contract.startDate | date:'dd/MM/yyyy' }}</td>
                <td>
                  <button class="btn-icon" title="Editar" (click)="editContract(contract)">
                    <span>✏️</span>
                  </button>
                  <button class="btn-icon" title="Visualizar" (click)="viewContract(contract)">
                    <span>👁️</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .contracts-container {
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .contracts-table {
      width: 100%;
      border-collapse: collapse;
    }

    .contracts-table th,
    .contracts-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    .contracts-table th {
      background-color: #f5f5f5;
      font-weight: 600;
    }

    .contracts-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 16px;
    }

    .card-content {
      padding: 0;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .btn-primary {
      background-color: #1976d2;
      color: white;
    }

    .btn-primary:hover {
      background-color: #1565c0;
    }

    .btn-icon {
      background: none;
      border: none;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      margin-right: 4px;
    }

    .btn-icon:hover {
      background-color: #f5f5f5;
    }

    .status-chip {
      padding: 4px 12px;
      border-radius: 16px;
      font-size: 12px;
      font-weight: 500;
    }

    .status-ativo {
      background-color: #e8f5e8;
      color: #2e7d32;
    }

    .status-em_andamento {
      background-color: #fff3e0;
      color: #f57c00;
    }

    .status-concluido {
      background-color: #e3f2fd;
      color: #1976d2;
    }
  `]
})
export class ContractsComponent {
  constructor(private router: Router) {}

  contracts = [
    {
      id: 'CTR-001',
      customer: 'Empresa ABC Ltda',
      value: 150000,
      status: 'ativo',
      startDate: new Date('2024-01-15')
    },
    {
      id: 'CTR-002',
      customer: 'Corporação XYZ S.A.',
      value: 280000,
      status: 'em_andamento',
      startDate: new Date('2024-02-01')
    },
    {
      id: 'CTR-003',
      customer: 'Indústria 123 Ltda',
      value: 95000,
      status: 'concluido',
      startDate: new Date('2023-12-10')
    }
  ];

  getStatusLabel(status: string): string {
    switch (status) {
      case 'ativo': return 'Ativo';
      case 'em_andamento': return 'Em Andamento';
      case 'concluido': return 'Concluído';
      default: return status;
    }
  }

  // Métodos para os botões
  addContract(): void {
    this.router.navigate(['/contracts/new']);
  }

  editContract(contract: any): void {
    this.router.navigate(['/contracts', contract.id, 'edit']);
  }

  viewContract(contract: any): void {
    this.router.navigate(['/contracts', contract.id]);
  }
}

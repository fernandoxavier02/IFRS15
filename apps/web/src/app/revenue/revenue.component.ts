import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'ifrs15-revenue',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="revenue-container">
      <div class="header">
        <h1>Reconhecimento de Receitas</h1>
        <button class="btn btn-primary">
          <span>📊</span>
          Calcular Receitas
        </button>
      </div>

      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-content">
            <h3>Receita Total Reconhecida</h3>
            <div class="amount">R$ 2.450.000,00</div>
          </div>
        </div>
        
        <div class="summary-card">
          <div class="card-content">
            <h3>Receita Pendente</h3>
            <div class="amount pending">R$ 525.000,00</div>
          </div>
        </div>
      </div>

      <div class="table-card">
        <div class="card-header">
          <h3>Obrigações de Performance</h3>
        </div>
        <div class="card-content">
          <table class="revenue-table">
            <thead>
              <tr>
                <th>Contrato</th>
                <th>Descrição</th>
                <th>Preço Alocado</th>
                <th>Progresso</th>
                <th>Receita Reconhecida</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let item of performanceObligations">
                <td>{{ item.contract }}</td>
                <td>{{ item.description }}</td>
                <td>{{ item.allocatedPrice | currency:'BRL' }}</td>
                <td>
                  <div class="progress-container">
                    <div class="progress-bar">
                      <div class="progress-fill" [style.width.%]="item.progress"></div>
                    </div>
                    <span class="progress-text">{{ item.progress }}%</span>
                  </div>
                </td>
                <td>{{ item.recognizedRevenue | currency:'BRL' }}</td>
                <td>
                  <button class="btn-icon">
                    <span>📈</span>
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
    .revenue-container {
      padding: 20px;
    }
    
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }
    
    .summary-cards {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .summary-card {
      text-align: center;
    }
    
    .amount {
      font-size: 2em;
      font-weight: bold;
      color: #4caf50;
      margin-top: 10px;
    }
    
    .amount.pending {
      color: #ff9800;
    }
    
    .revenue-table {
      width: 100%;
    }
    
    .progress-container {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    
    .progress-text {
      min-width: 40px;
      font-size: 0.9em;
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
    }

    .btn-icon:hover {
      background-color: #f5f5f5;
    }

    .summary-card, .table-card {
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      padding: 16px;
    }

    .card-header {
      border-bottom: 1px solid #e0e0e0;
      padding-bottom: 16px;
      margin-bottom: 16px;
    }

    .card-header h3 {
      margin: 0;
      color: #333;
    }

    .card-content {
      padding: 0;
    }

    .progress-bar {
      width: 100px;
      height: 8px;
      background-color: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background-color: #4caf50;
      transition: width 0.3s ease;
    }

    .revenue-table {
      border-collapse: collapse;
    }

    .revenue-table th,
    .revenue-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #e0e0e0;
    }

    .revenue-table th {
      background-color: #f5f5f5;
      font-weight: 600;
    }
  `]
})
export class RevenueComponent {
  performanceObligations = [
    {
      contract: 'CTR-001',
      description: 'Desenvolvimento de Software',
      allocatedPrice: 100000,
      progress: 75,
      recognizedRevenue: 75000
    },
    {
      contract: 'CTR-001',
      description: 'Treinamento e Suporte',
      allocatedPrice: 50000,
      progress: 40,
      recognizedRevenue: 20000
    },
    {
      contract: 'CTR-002',
      description: 'Consultoria Especializada',
      allocatedPrice: 180000,
      progress: 90,
      recognizedRevenue: 162000
    },
    {
      contract: 'CTR-002',
      description: 'Implementação',
      allocatedPrice: 100000,
      progress: 60,
      recognizedRevenue: 60000
    }
  ];
}

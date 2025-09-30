import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

export interface RevenueData {
  period: Date;
  recognizedRevenue: number;
  cumulativeRevenue: number;
  contractBalance: number;
  progress: number;
}

@Component({
  selector: 'app-revenue-chart',
  template: `
    <div class="chart-container">
      <div class="chart-header">
        <h3>{{ title }}</h3>
        <div class="chart-controls">
          <mat-button-toggle-group [(value)]="chartType" (change)="updateChart()">
            <mat-button-toggle value="line">Linha</mat-button-toggle>
            <mat-button-toggle value="bar">Barras</mat-button-toggle>
            <mat-button-toggle value="area">Área</mat-button-toggle>
          </mat-button-toggle-group>
        </div>
      </div>
      <canvas #chartCanvas></canvas>
    </div>
  `,
  styles: [`
    .chart-container {
      width: 100%;
      height: 400px;
      padding: 16px;
    }
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    canvas {
      max-height: 350px;
    }
  `]
})
export class RevenueChartComponent implements OnInit, OnChanges {
  @Input() data: RevenueData[] = [];
  @Input() title: string = 'Receita Reconhecida';
  @Input() chartType: 'line' | 'bar' | 'area' = 'line';

  private chart: Chart | null = null;

  ngOnInit(): void {
    this.createChart();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['data'] && this.chart) {
      this.updateChart();
    }
  }

  private createChart(): void {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    this.chart = new Chart(ctx, {
      type: this.chartType,
      data: {
        labels: this.data.map(d => d.period.toLocaleDateString('pt-BR')),
        datasets: [
          {
            label: 'Receita Reconhecida',
            data: this.data.map(d => d.recognizedRevenue),
            borderColor: '#2196F3',
            backgroundColor: 'rgba(33, 150, 243, 0.1)',
            tension: 0.4
          },
          {
            label: 'Receita Acumulada',
            data: this.data.map(d => d.cumulativeRevenue),
            borderColor: '#4CAF50',
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            tension: 0.4
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: function(value) {
                return new Intl.NumberFormat('pt-BR', {
                  style: 'currency',
                  currency: 'BRL'
                }).format(value as number);
              }
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.dataset.label + ': ' + 
                  new Intl.NumberFormat('pt-BR', {
                    style: 'currency',
                    currency: 'BRL'
                  }).format(context.parsed.y);
              }
            }
          }
        }
      }
    });
  }

  updateChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.createChart();
    }
  }
}

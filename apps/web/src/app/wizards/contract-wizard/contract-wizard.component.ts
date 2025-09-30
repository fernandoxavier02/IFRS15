import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ContractsApiService } from '../../shared/services/api.service';

export interface WizardData {
  contractInfo: any;
  performanceObligations: any[];
  priceAllocation: any;
  revenueSimulation: any;
}

@Component({
  selector: 'app-contract-wizard',
  templateUrl: './contract-wizard.component.html',
  styleUrls: ['./contract-wizard.component.scss']
})
export class ContractWizardComponent implements OnInit {
  // Form groups for each step
  contractInfoForm!: FormGroup;
  performanceObligationsForm!: FormGroup;
  priceAllocationForm!: FormGroup;
  simulationForm!: FormGroup;

  // Wizard data
  wizardData: WizardData = {
    contractInfo: {},
    performanceObligations: [],
    priceAllocation: {},
    revenueSimulation: {}
  };

  // State
  loading = false;
  currentStep = 0;
  isLinear = true;

  // Options
  allocationMethods = [
    { value: 'ssp', label: 'Stand-alone Selling Price (SSP)' },
    { value: 'residual', label: 'Método Residual' },
    { value: 'cost_plus_margin', label: 'Custo + Margem' }
  ];

  reconhecimentoMethods = [
    { value: 'point_in_time', label: 'Ponto no Tempo' },
    { value: 'over_time_output', label: 'Ao Longo do Tempo - Output' },
    { value: 'over_time_input', label: 'Ao Longo do Tempo - Input' },
    { value: 'over_time_time_elapsed', label: 'Ao Longo do Tempo - Tempo Decorrido' }
  ];

  constructor(
    private fb: FormBuilder,
    private contractsApi: ContractsApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initializeForms();
  }

  initializeForms(): void {
    // Step 1: Contract Information
    this.contractInfoForm = this.fb.group({
      numero: ['', [Validators.required, Validators.minLength(3)]],
      cliente: ['', [Validators.required, Validators.minLength(2)]],
      descricao: ['', Validators.required],
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required],
      valorTotal: ['', [Validators.required, Validators.min(0.01)]],
      moeda: ['BRL', Validators.required],
      consideracaoVariavel: [false],
      valorVariavel: [0],
      restricaoVariavel: ['most_likely'],
      componenteFinanciamento: [false],
      taxaDesconto: [0],
      observacoes: ['']
    });

    // Step 2: Performance Obligations
    this.performanceObligationsForm = this.fb.group({
      pos: this.fb.array([])
    });

    // Step 3: Price Allocation
    this.priceAllocationForm = this.fb.group({
      metodoAlocacao: ['ssp', Validators.required],
      ajusteDesconto: [true],
      considerarCustos: [false],
      margemPadrao: [20],
      observacoesAlocacao: ['']
    });

    // Step 4: Revenue Simulation
    this.simulationForm = this.fb.group({
      periodoSimulacao: [12, [Validators.required, Validators.min(1)]],
      frequenciaReconhecimento: ['monthly', Validators.required],
      incluirProjecoes: [true],
      cenarioConservador: [false]
    });
  }

  // Step navigation
  onStepChange(stepIndex: number): void {
    this.currentStep = stepIndex;
  }

  nextStep(): void {
    if (this.isCurrentStepValid()) {
      this.saveCurrentStepData();
      if (this.currentStep < 3) {
        this.currentStep++;
      }
    }
  }

  previousStep(): void {
    if (this.currentStep > 0) {
      this.currentStep--;
    }
  }

  isCurrentStepValid(): boolean {
    switch (this.currentStep) {
      case 0: return this.contractInfoForm.valid;
      case 1: return this.performanceObligationsForm.valid;
      case 2: return this.priceAllocationForm.valid;
      case 3: return this.simulationForm.valid;
      default: return false;
    }
  }

  saveCurrentStepData(): void {
    switch (this.currentStep) {
      case 0:
        this.wizardData.contractInfo = this.contractInfoForm.value;
        break;
      case 1:
        this.wizardData.performanceObligations = this.performanceObligationsForm.value.pos;
        break;
      case 2:
        this.wizardData.priceAllocation = this.priceAllocationForm.value;
        break;
      case 3:
        this.wizardData.revenueSimulation = this.simulationForm.value;
        break;
    }
  }

  // Performance Obligations management
  addPerformanceObligation(): void {
    const posArray = this.performanceObligationsForm.get('pos') as any;
    const newPO = this.fb.group({
      descricao: ['', [Validators.required, Validators.minLength(3)]],
      tipo: ['produto', Validators.required],
      metodoReconhecimento: ['over_time_output', Validators.required],
      sspEstimado: ['', [Validators.required, Validators.min(0.01)]],
      custosEstimados: [0],
      margemEstimada: [20],
      dataInicio: ['', Validators.required],
      dataFim: ['', Validators.required],
      metricaProgresso: ['output_units'],
      observacoes: ['']
    });
    posArray.push(newPO);
  }

  removePerformanceObligation(index: number): void {
    const posArray = this.performanceObligationsForm.get('pos') as any;
    if (posArray.length > 1) {
      posArray.removeAt(index);
    }
  }

  get performanceObligations() {
    return this.performanceObligationsForm.get('pos') as any;
  }

  // Price allocation calculations
  calculateAllocation(): void {
    this.loading = true;
    
    const allocationData = {
      contractValue: this.wizardData.contractInfo.valorTotal,
      performanceObligations: this.wizardData.performanceObligations,
      method: this.priceAllocationForm.get('metodoAlocacao')?.value,
      adjustDiscount: this.priceAllocationForm.get('ajusteDesconto')?.value
    };

    // Simulate API call for price allocation
    setTimeout(() => {
      this.wizardData.priceAllocation = {
        ...this.priceAllocationForm.value,
        allocations: this.simulateAllocationCalculation(allocationData)
      };
      this.loading = false;
      console.log('Alocação de preço calculada com sucesso!');
    }, 2000);
  }

  private simulateAllocationCalculation(data: any): any[] {
    const totalSSP = data.performanceObligations.reduce((sum: number, po: any) => sum + (po.sspEstimado || 0), 0);
    const contractValue = data.contractValue;
    const discountAdjustment = totalSSP > contractValue ? (contractValue / totalSSP) : 1;

    return data.performanceObligations.map((po: any, index: number) => ({
      poIndex: index,
      descricao: po.descricao,
      sspOriginal: po.sspEstimado,
      percentualAlocacao: (po.sspEstimado / totalSSP) * 100,
      valorAlocado: po.sspEstimado * discountAdjustment,
      ajusteDesconto: po.sspEstimado * (1 - discountAdjustment)
    }));
  }

  // Revenue simulation
  generateSimulation(): void {
    this.loading = true;

    const simulationData = {
      contract: this.wizardData.contractInfo,
      performanceObligations: this.wizardData.performanceObligations,
      priceAllocation: this.wizardData.priceAllocation,
      simulationParams: this.simulationForm.value
    };

    // Simulate API call for revenue simulation
    setTimeout(() => {
      this.wizardData.revenueSimulation = {
        ...this.simulationForm.value,
        schedule: this.simulateRevenueSchedule(simulationData),
        summary: this.simulateRevenueSummary(simulationData)
      };
      this.loading = false;
      console.log('Simulação de receita gerada com sucesso!');
    }, 2000);
  }

  private simulateRevenueSchedule(data: any): any[] {
    const periods = data.simulationParams.periodoSimulacao;
    const schedule = [];
    
    for (let i = 0; i < periods; i++) {
      const period = new Date();
      period.setMonth(period.getMonth() + i);
      
      schedule.push({
        periodo: period,
        revenueRecognized: Math.random() * 10000,
        cumulativeRevenue: Math.random() * 50000,
        remainingRevenue: Math.random() * 40000,
        progressPercentage: (i / periods) * 100
      });
    }
    
    return schedule;
  }

  private simulateRevenueSummary(data: any): any {
    return {
      totalContractValue: data.contract.valorTotal,
      totalRevenueToRecognize: data.contract.valorTotal * 0.95,
      averageMonthlyRevenue: (data.contract.valorTotal * 0.95) / data.simulationParams.periodoSimulacao,
      estimatedCompletionDate: new Date(Date.now() + (data.simulationParams.periodoSimulacao * 30 * 24 * 60 * 60 * 1000)),
      riskFactors: ['Consideração variável', 'Dependência de marcos'],
      recommendations: [
        'Monitorar progresso mensalmente',
        'Revisar estimativas trimestralmente',
        'Documentar mudanças significativas'
      ]
    };
  }

  // Final submission
  finalizeContract(): void {
    this.loading = true;
    this.saveCurrentStepData();

    const finalContractData = {
      ...this.wizardData.contractInfo,
      performanceObligations: this.wizardData.performanceObligations.map((po, index) => ({
        ...po,
        valorAlocado: this.wizardData.priceAllocation.allocations?.[index]?.valorAlocado || po.sspEstimado
      })),
      priceAllocation: this.wizardData.priceAllocation,
      revenueSimulation: this.wizardData.revenueSimulation
    };

    this.contractsApi.createContract(finalContractData).subscribe({
      next: (result) => {
        this.loading = false;
        console.log('Contrato criado com sucesso!');
        this.router.navigate(['/contracts', result.id]);
      },
      error: (error) => {
        this.loading = false;
        console.error(`Erro ao criar contrato: ${error.message}`);
      }
    });
  }

  // Utility methods
  getTotalSSP(): number {
    return this.performanceObligations.controls.reduce((total: number, control: any) => {
      return total + (control.get('sspEstimado')?.value || 0);
    }, 0);
  }

  getTotalAllocatedValue(): number {
    return this.wizardData.priceAllocation.allocations?.reduce((total: number, allocation: any) => {
      return total + (allocation.valorAlocado || 0);
    }, 0) || 0;
  }

  getErrorMessage(fieldName: string, formGroup: FormGroup): string {
    const control = formGroup.get(fieldName);
    
    if (control?.hasError('required')) {
      return 'Este campo é obrigatório';
    }
    if (control?.hasError('minlength')) {
      return `Mínimo de ${control.errors?.['minlength'].requiredLength} caracteres`;
    }
    if (control?.hasError('min')) {
      return `Valor deve ser maior que ${control.errors?.['min'].min}`;
    }
    
    return '';
  }
}

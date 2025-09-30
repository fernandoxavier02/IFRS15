import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-ifrs15-tooltip',
  template: `
    <mat-icon 
      [matTooltip]="tooltipText" 
      matTooltipClass="ifrs15-tooltip"
      [matTooltipPosition]="position"
      class="info-icon">
      {{ icon }}
    </mat-icon>
  `,
  styles: [`
    .info-icon {
      color: #1976d2;
      font-size: 18px;
      width: 18px;
      height: 18px;
      cursor: help;
      margin-left: 4px;
    }
    
    :host ::ng-deep .ifrs15-tooltip {
      background-color: #1976d2;
      color: white;
      font-size: 12px;
      max-width: 300px;
      padding: 8px 12px;
      border-radius: 4px;
      line-height: 1.4;
    }
  `]
})
export class Ifrs15TooltipComponent {
  @Input() field: string = '';
  @Input() icon: string = 'help_outline';
  @Input() position: 'above' | 'below' | 'left' | 'right' = 'above';

  get tooltipText(): string {
    return this.getIfrs15Guidance(this.field);
  }

  private getIfrs15Guidance(field: string): string {
    const guidance: { [key: string]: string } = {
      // Step 1: Contract Identification
      'contract_identification': 'IFRS 15.10: Um contrato existe quando há acordo entre partes que cria direitos e obrigações exigíveis.',
      'commercial_substance': 'IFRS 15.9(e): O contrato deve ter substância comercial (risco, tempo ou valor dos fluxos de caixa da entidade mudará).',
      'collectibility': 'IFRS 15.9(e): É provável que a entidade colete a contraprestação à qual terá direito.',
      
      // Step 2: Performance Obligations
      'performance_obligation': 'IFRS 15.22: Promessa de transferir bem/serviço distinto ou série de bens/serviços distintos.',
      'distinct_good_service': 'IFRS 15.27: Bem/serviço é distinto se: (a) cliente pode se beneficiar e (b) é separadamente identificável.',
      'series_criterion': 'IFRS 15.23: Série de bens/serviços distintos que são substancialmente os mesmos e têm mesmo padrão de transferência.',
      
      // Step 3: Transaction Price
      'transaction_price': 'IFRS 15.47: Valor da contraprestação que a entidade espera ter direito em troca da transferência de bens/serviços.',
      'variable_consideration': 'IFRS 15.50: Contraprestação prometida pode variar devido a descontos, bônus, penalidades, etc.',
      'constraint_variable': 'IFRS 15.56: Incluir valor estimado apenas na medida em que seja altamente provável que não ocorrerá reversão significativa.',
      'most_likely_amount': 'IFRS 15.53(a): Valor único mais provável em uma faixa de valores possíveis (para dois resultados possíveis).',
      'expected_value': 'IFRS 15.53(b): Soma de valores ponderados por probabilidade (para muitos resultados possíveis).',
      'financing_component': 'IFRS 15.60: Ajustar preço da transação pelo efeito do valor do dinheiro no tempo se significativo.',
      'significant_financing': 'IFRS 15.62: Considerar se período entre pagamento e transferência é superior a um ano.',
      
      // Step 4: Price Allocation
      'price_allocation': 'IFRS 15.73: Alocar preço da transação a cada obrigação de performance com base em preços de venda individuais relativos.',
      'standalone_selling_price': 'IFRS 15.77: Preço pelo qual a entidade venderia separadamente um bem/serviço prometido a um cliente.',
      'observable_ssp': 'IFRS 15.77: Melhor evidência de SSP é preço observável quando a entidade vende bem/serviço separadamente.',
      'estimate_ssp': 'IFRS 15.78: Se SSP não for observável, estimar usando: (a) mercado ajustado, (b) custo esperado mais margem, (c) residual.',
      'residual_approach': 'IFRS 15.79: Usar apenas quando SSP é altamente variável ou incerto.',
      'discount_allocation': 'IFRS 15.81: Alocar desconto proporcionalmente a todas as obrigações, exceto se evidência de alocação específica.',
      
      // Step 5: Revenue Recognition
      'revenue_recognition': 'IFRS 15.31: Reconhecer receita quando (ou conforme) a entidade satisfaz obrigação de performance.',
      'control_transfer': 'IFRS 15.33: Obrigação é satisfeita quando cliente obtém controle do ativo.',
      'point_in_time': 'IFRS 15.38: Reconhecer receita no ponto no tempo quando controle é transferido.',
      'over_time': 'IFRS 15.35: Reconhecer receita ao longo do tempo se: (a) cliente recebe e consome, (b) cliente controla ativo, ou (c) sem uso alternativo.',
      'progress_measurement': 'IFRS 15.41: Medir progresso usando métodos de output (valor transferido) ou input (esforços despendidos).',
      'output_methods': 'IFRS 15.B15: Reconhecer receita com base no valor direto para cliente (unidades produzidas, marcos alcançados).',
      'input_methods': 'IFRS 15.B18: Reconhecer receita com base nos esforços da entidade (custos incorridos, horas trabalhadas).',
      
      // Contract Modifications
      'contract_modification': 'IFRS 15.18: Mudança no escopo ou preço aprovada pelas partes.',
      'separate_contract': 'IFRS 15.20: Tratar como contrato separado se adiciona bens/serviços distintos pelo SSP.',
      'prospective_modification': 'IFRS 15.21(a): Se bens/serviços restantes são distintos, alocar preço remanescente.',
      'retrospective_modification': 'IFRS 15.21(b): Se bens/serviços não são distintos, tratar como parte do contrato original.',
      
      // Common Fields
      'contract_number': 'Identificador único do contrato para rastreabilidade e auditoria.',
      'client_name': 'Identificação da contraparte do contrato conforme documentação legal.',
      'contract_value': 'Valor total da contraprestação conforme IFRS 15.47-72.',
      'start_date': 'Data de início das obrigações contratuais.',
      'end_date': 'Data prevista para conclusão de todas as obrigações.',
      'currency': 'Moeda funcional ou de apresentação conforme IAS 21.',
      'recognition_method': 'Método de reconhecimento baseado nos critérios IFRS 15.35 e 15.38.',
      'progress_metric': 'Métrica para medir progresso conforme IFRS 15.41-43.',
      'allocation_method': 'Método de alocação de preço conforme IFRS 15.76-80.',
      'estimated_costs': 'Custos esperados para satisfazer a obrigação de performance.',
      'margin_percentage': 'Margem esperada sobre custos para estimativa de SSP.'
    };

    return guidance[field] || 'Orientação IFRS 15 não disponível para este campo.';
  }
}

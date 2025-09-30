import { Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})
export class ValidationService {

  // IFRS 15 specific validators
  static contractNumberValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const contractPattern = /^[A-Z]{2,4}-\d{4}-\d{3,4}$/;
      if (!contractPattern.test(control.value)) {
        return { 
          contractNumber: { 
            message: 'Formato inválido. Use: CTR-2024-001' 
          } 
        };
      }
      return null;
    };
  }

  static documentValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const value = control.value.replace(/\D/g, '');
      
      // CPF validation
      if (value.length === 11) {
        if (!this.isValidCPF(value)) {
          return { document: { message: 'CPF inválido' } };
        }
      }
      // CNPJ validation
      else if (value.length === 14) {
        if (!this.isValidCNPJ(value)) {
          return { document: { message: 'CNPJ inválido' } };
        }
      }
      else {
        return { document: { message: 'Documento deve ter 11 (CPF) ou 14 (CNPJ) dígitos' } };
      }
      
      return null;
    };
  }

  static currencyValidator(min: number = 0): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const value = parseFloat(control.value);
      if (isNaN(value)) {
        return { currency: { message: 'Valor deve ser numérico' } };
      }
      
      if (value < min) {
        return { currency: { message: `Valor deve ser maior que ${min}` } };
      }
      
      return null;
    };
  }

  static percentageValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      
      const value = parseFloat(control.value);
      if (isNaN(value)) {
        return { percentage: { message: 'Percentual deve ser numérico' } };
      }
      
      if (value < 0 || value > 100) {
        return { percentage: { message: 'Percentual deve estar entre 0 e 100' } };
      }
      
      return null;
    };
  }

  static dateRangeValidator(startDateField: string, endDateField: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const startDate = control.get(startDateField)?.value;
      const endDate = control.get(endDateField)?.value;
      
      if (!startDate || !endDate) return null;
      
      if (new Date(startDate) >= new Date(endDate)) {
        return { 
          dateRange: { 
            message: 'Data de fim deve ser posterior à data de início' 
          } 
        };
      }
      
      return null;
    };
  }

  static sspAllocationValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const formArray = control.get('performanceObligations');
      if (!formArray || !formArray.value) return null;
      
      const contractValue = control.get('contractValue')?.value || 0;
      const totalSSP = formArray.value.reduce((sum: number, po: any) => 
        sum + (parseFloat(po.sspEstimado) || 0), 0);
      
      if (totalSSP === 0) {
        return { 
          sspAllocation: { 
            message: 'Pelo menos uma PO deve ter SSP estimado' 
          } 
        };
      }
      
      // Warning if total SSP is significantly different from contract value
      const variance = Math.abs(totalSSP - contractValue) / contractValue;
      if (variance > 0.2) { // 20% variance threshold
        return { 
          sspAllocation: { 
            message: `Total SSP (${totalSSP.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'})}) difere significativamente do valor do contrato`,
            warning: true
          } 
        };
      }
      
      return null;
    };
  }

  // IFRS 15 business rule validators
  static ifrs15ContractValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors: any = {};
      
      // Check if contract has commercial substance
      const contractValue = control.get('valorTotal')?.value || 0;
      if (contractValue <= 0) {
        errors.commercialSubstance = 'Contrato deve ter substância comercial (valor > 0)';
      }
      
      // Check if parties are committed
      const startDate = control.get('dataInicio')?.value;
      const endDate = control.get('dataFim')?.value;
      if (!startDate || !endDate) {
        errors.commitment = 'Datas de início e fim são obrigatórias para demonstrar compromisso';
      }
      
      // Check payment terms are identifiable
      const hasVariableConsideration = control.get('consideracaoVariavel')?.value;
      const variableAmount = control.get('valorVariavel')?.value || 0;
      if (hasVariableConsideration && variableAmount <= 0) {
        errors.paymentTerms = 'Valor da consideração variável deve ser especificado';
      }
      
      return Object.keys(errors).length > 0 ? { ifrs15Contract: errors } : null;
    };
  }

  static performanceObligationValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const errors: any = {};
      
      const description = control.get('descricao')?.value;
      const recognitionMethod = control.get('metodoReconhecimento')?.value;
      const sspEstimated = control.get('sspEstimado')?.value || 0;
      
      // Check if PO is distinct
      if (!description || description.length < 10) {
        errors.distinctness = 'Descrição deve ser específica para demonstrar que a PO é distinta';
      }
      
      // Check SSP estimation
      if (sspEstimated <= 0) {
        errors.ssp = 'SSP deve ser estimado para alocação de preço';
      }
      
      // Check recognition method alignment
      if (recognitionMethod?.startsWith('over_time')) {
        const progressMetric = control.get('metricaProgresso')?.value;
        if (!progressMetric) {
          errors.progressMeasurement = 'Métrica de progresso é obrigatória para reconhecimento ao longo do tempo';
        }
      }
      
      return Object.keys(errors).length > 0 ? { performanceObligation: errors } : null;
    };
  }

  // Utility methods
  private static isValidCPF(cpf: string): boolean {
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
    
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return false;
    
    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    return remainder === parseInt(cpf.charAt(10));
  }

  private static isValidCNPJ(cnpj: string): boolean {
    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
    
    let length = cnpj.length - 2;
    let numbers = cnpj.substring(0, length);
    const digits = cnpj.substring(length);
    let sum = 0;
    let pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    let result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    if (result !== parseInt(digits.charAt(0))) return false;
    
    length = length + 1;
    numbers = cnpj.substring(0, length);
    sum = 0;
    pos = length - 7;
    
    for (let i = length; i >= 1; i--) {
      sum += parseInt(numbers.charAt(length - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    
    result = sum % 11 < 2 ? 0 : 11 - sum % 11;
    return result === parseInt(digits.charAt(1));
  }

  // Error message helper
  getErrorMessage(control: AbstractControl, fieldName: string): string {
    if (!control.errors) return '';
    
    const errors = control.errors;
    
    // Standard validation errors
    if (errors['required']) return `${fieldName} é obrigatório`;
    if (errors['minlength']) return `${fieldName} deve ter pelo menos ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength']) return `${fieldName} deve ter no máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['min']) return `${fieldName} deve ser maior que ${errors['min'].min}`;
    if (errors['max']) return `${fieldName} deve ser menor que ${errors['max'].max}`;
    if (errors['email']) return 'Email inválido';
    
    // Custom validation errors
    if (errors['contractNumber']) return errors['contractNumber'].message;
    if (errors['document']) return errors['document'].message;
    if (errors['currency']) return errors['currency'].message;
    if (errors['percentage']) return errors['percentage'].message;
    if (errors['dateRange']) return errors['dateRange'].message;
    if (errors['sspAllocation']) return errors['sspAllocation'].message;
    
    // IFRS 15 specific errors
    if (errors['ifrs15Contract']) {
      const ifrsErrors = errors['ifrs15Contract'];
      return Object.values(ifrsErrors)[0] as string;
    }
    
    if (errors['performanceObligation']) {
      const poErrors = errors['performanceObligation'];
      return Object.values(poErrors)[0] as string;
    }
    
    return 'Campo inválido';
  }

  // IFRS 15 guidance tooltips
  getIfrs15Tooltip(field: string): string {
    const tooltips: { [key: string]: string } = {
      'contractNumber': 'Identificador único do contrato conforme IFRS 15.10',
      'consideracaoVariavel': 'Valor que pode variar devido a descontos, bônus, penalidades, etc. (IFRS 15.50-59)',
      'restricaoVariavel': 'Método para estimar consideração variável: valor mais provável ou valor esperado (IFRS 15.53)',
      'componenteFinanciamento': 'Ajuste necessário quando há diferença significativa entre pagamento e transferência (IFRS 15.60-65)',
      'metodoReconhecimento': 'Reconhecimento no ponto no tempo (IFRS 15.38) ou ao longo do tempo (IFRS 15.35)',
      'metodoAlocacao': 'Alocação baseada em SSP observável, estimado ou método residual (IFRS 15.76-80)',
      'sspEstimado': 'Preço pelo qual a entidade venderia separadamente o bem/serviço (IFRS 15.77)',
      'metricaProgresso': 'Métrica para medir progresso na satisfação da obrigação (IFRS 15.41-43)'
    };
    
    return tooltips[field] || '';
  }
}

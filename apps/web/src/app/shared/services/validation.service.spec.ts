import { TestBed } from '@angular/core/testing';
import { FormControl, FormGroup, FormArray } from '@angular/forms';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ValidationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('contractNumberValidator', () => {
    it('should validate correct contract number format', () => {
      const validator = ValidationService.contractNumberValidator();
      const control = new FormControl('CTR-2024-001');
      
      expect(validator(control)).toBeNull();
    });

    it('should reject invalid contract number format', () => {
      const validator = ValidationService.contractNumberValidator();
      const control = new FormControl('INVALID-FORMAT');
      
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['contractNumber']).toBeDefined();
    });

    it('should allow empty value', () => {
      const validator = ValidationService.contractNumberValidator();
      const control = new FormControl('');
      
      expect(validator(control)).toBeNull();
    });
  });

  describe('documentValidator', () => {
    it('should validate correct CPF', () => {
      const validator = ValidationService.documentValidator();
      const control = new FormControl('11144477735'); // Valid CPF
      
      expect(validator(control)).toBeNull();
    });

    it('should validate correct CNPJ', () => {
      const validator = ValidationService.documentValidator();
      const control = new FormControl('11222333000181'); // Valid CNPJ
      
      expect(validator(control)).toBeNull();
    });

    it('should reject invalid CPF', () => {
      const validator = ValidationService.documentValidator();
      const control = new FormControl('12345678901'); // Invalid CPF
      
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['document']).toBeDefined();
    });

    it('should reject invalid CNPJ', () => {
      const validator = ValidationService.documentValidator();
      const control = new FormControl('12345678000100'); // Invalid CNPJ
      
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['document']).toBeDefined();
    });

    it('should reject document with wrong length', () => {
      const validator = ValidationService.documentValidator();
      const control = new FormControl('123456789'); // Wrong length
      
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['document']).toBeDefined();
    });
  });

  describe('currencyValidator', () => {
    it('should validate positive currency value', () => {
      const validator = ValidationService.currencyValidator(0);
      const control = new FormControl('100.50');
      
      expect(validator(control)).toBeNull();
    });

    it('should reject negative currency value', () => {
      const validator = ValidationService.currencyValidator(0);
      const control = new FormControl('-50');
      
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['currency']).toBeDefined();
    });

    it('should reject non-numeric currency value', () => {
      const validator = ValidationService.currencyValidator(0);
      const control = new FormControl('abc');
      
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['currency']).toBeDefined();
    });

    it('should validate minimum value', () => {
      const validator = ValidationService.currencyValidator(100);
      const control = new FormControl('50');
      
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['currency']).toBeDefined();
    });
  });

  describe('percentageValidator', () => {
    it('should validate valid percentage', () => {
      const validator = ValidationService.percentageValidator();
      const control = new FormControl('50');
      
      expect(validator(control)).toBeNull();
    });

    it('should reject percentage over 100', () => {
      const validator = ValidationService.percentageValidator();
      const control = new FormControl('150');
      
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['percentage']).toBeDefined();
    });

    it('should reject negative percentage', () => {
      const validator = ValidationService.percentageValidator();
      const control = new FormControl('-10');
      
      const result = validator(control);
      expect(result).not.toBeNull();
      expect(result?.['percentage']).toBeDefined();
    });
  });

  describe('dateRangeValidator', () => {
    it('should validate correct date range', () => {
      const validator = ValidationService.dateRangeValidator('startDate', 'endDate');
      const formGroup = new FormGroup({
        startDate: new FormControl('2024-01-01'),
        endDate: new FormControl('2024-12-31')
      });
      
      expect(validator(formGroup)).toBeNull();
    });

    it('should reject invalid date range', () => {
      const validator = ValidationService.dateRangeValidator('startDate', 'endDate');
      const formGroup = new FormGroup({
        startDate: new FormControl('2024-12-31'),
        endDate: new FormControl('2024-01-01')
      });
      
      const result = validator(formGroup);
      expect(result).not.toBeNull();
      expect(result?.['dateRange']).toBeDefined();
    });
  });

  describe('ifrs15ContractValidator', () => {
    it('should validate contract with commercial substance', () => {
      const validator = ValidationService.ifrs15ContractValidator();
      const formGroup = new FormGroup({
        valorTotal: new FormControl(100000),
        dataInicio: new FormControl('2024-01-01'),
        dataFim: new FormControl('2024-12-31'),
        consideracaoVariavel: new FormControl(false)
      });
      
      expect(validator(formGroup)).toBeNull();
    });

    it('should reject contract without commercial substance', () => {
      const validator = ValidationService.ifrs15ContractValidator();
      const formGroup = new FormGroup({
        valorTotal: new FormControl(0),
        dataInicio: new FormControl('2024-01-01'),
        dataFim: new FormControl('2024-12-31')
      });
      
      const result = validator(formGroup);
      expect(result).not.toBeNull();
      expect(result?.['ifrs15Contract']).toBeDefined();
    });

    it('should require variable consideration amount when enabled', () => {
      const validator = ValidationService.ifrs15ContractValidator();
      const formGroup = new FormGroup({
        valorTotal: new FormControl(100000),
        dataInicio: new FormControl('2024-01-01'),
        dataFim: new FormControl('2024-12-31'),
        consideracaoVariavel: new FormControl(true),
        valorVariavel: new FormControl(0)
      });
      
      const result = validator(formGroup);
      expect(result).not.toBeNull();
      expect(result?.['ifrs15Contract']).toBeDefined();
    });
  });

  describe('performanceObligationValidator', () => {
    it('should validate distinct performance obligation', () => {
      const validator = ValidationService.performanceObligationValidator();
      const formGroup = new FormGroup({
        descricao: new FormControl('Detailed software license with specific features and functionality'),
        sspEstimado: new FormControl(50000),
        metodoReconhecimento: new FormControl('point_in_time')
      });
      
      expect(validator(formGroup)).toBeNull();
    });

    it('should reject performance obligation with insufficient description', () => {
      const validator = ValidationService.performanceObligationValidator();
      const formGroup = new FormGroup({
        descricao: new FormControl('Short'),
        sspEstimado: new FormControl(50000),
        metodoReconhecimento: new FormControl('point_in_time')
      });
      
      const result = validator(formGroup);
      expect(result).not.toBeNull();
      expect(result?.['performanceObligation']).toBeDefined();
    });

    it('should require progress metric for over-time recognition', () => {
      const validator = ValidationService.performanceObligationValidator();
      const formGroup = new FormGroup({
        descricao: new FormControl('Detailed service description'),
        sspEstimado: new FormControl(50000),
        metodoReconhecimento: new FormControl('over_time_input'),
        metricaProgresso: new FormControl('')
      });
      
      const result = validator(formGroup);
      expect(result).not.toBeNull();
      expect(result?.['performanceObligation']).toBeDefined();
    });
  });

  describe('getErrorMessage', () => {
    it('should return correct error message for required field', () => {
      const control = new FormControl('');
      control.setErrors({ required: true });
      
      const message = service.getErrorMessage(control, 'Test Field');
      expect(message).toBe('Test Field é obrigatório');
    });

    it('should return correct error message for minlength', () => {
      const control = new FormControl('ab');
      control.setErrors({ minlength: { requiredLength: 5, actualLength: 2 } });
      
      const message = service.getErrorMessage(control, 'Test Field');
      expect(message).toBe('Test Field deve ter pelo menos 5 caracteres');
    });

    it('should return correct error message for custom validation', () => {
      const control = new FormControl('invalid');
      control.setErrors({ contractNumber: { message: 'Invalid format' } });
      
      const message = service.getErrorMessage(control, 'Contract Number');
      expect(message).toBe('Invalid format');
    });

    it('should return default message for unknown error', () => {
      const control = new FormControl('invalid');
      control.setErrors({ unknown: true });
      
      const message = service.getErrorMessage(control, 'Test Field');
      expect(message).toBe('Campo inválido');
    });
  });

  describe('getIfrs15Tooltip', () => {
    it('should return tooltip for known field', () => {
      const tooltip = service.getIfrs15Tooltip('contractNumber');
      expect(tooltip).toContain('IFRS 15');
    });

    it('should return empty string for unknown field', () => {
      const tooltip = service.getIfrs15Tooltip('unknownField');
      expect(tooltip).toBe('');
    });
  });
});

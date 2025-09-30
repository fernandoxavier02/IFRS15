import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialogModule } from '@angular/material/dialog';
import { RouterTestingModule } from '@angular/router/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { ContractFormComponent } from './contract-form.component';
import { ContractsApiService } from '../../shared/services/api-integration.service';
import { ValidationService } from '../../shared/services/validation.service';
import { AuthService } from '../../shared/guards/rbac.guard';

describe('ContractFormComponent', () => {
  let component: ContractFormComponent;
  let fixture: ComponentFixture<ContractFormComponent>;
  let mockContractsApi: jasmine.SpyObj<ContractsApiService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockContract = {
    id: '1',
    numero: 'CTR-2024-001',
    cliente: 'Test Client',
    descricao: 'Test contract description',
    valorTotal: 100000,
    dataInicio: new Date('2024-01-01'),
    dataFim: new Date('2024-12-31'),
    status: 'ativo',
    performanceObligations: [
      {
        id: '1',
        descricao: 'Software License',
        tipo: 'produto',
        metodoReconhecimento: 'point_in_time',
        sspEstimado: 60000,
        valorAlocado: 60000
      },
      {
        id: '2',
        descricao: 'Support Services',
        tipo: 'servico',
        metodoReconhecimento: 'over_time_time_elapsed',
        sspEstimado: 40000,
        valorAlocado: 40000
      }
    ]
  };

  beforeEach(async () => {
    const contractsApiSpy = jasmine.createSpyObj('ContractsApiService', [
      'getContract', 'createContract', 'updateContract'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [
      'hasPermission', 'getCurrentUser'
    ]);

    await TestBed.configureTestingModule({
      declarations: [ContractFormComponent],
      imports: [
        ReactiveFormsModule,
        MatSnackBarModule,
        MatDialogModule,
        RouterTestingModule,
        NoopAnimationsModule
      ],
      providers: [
        { provide: ContractsApiService, useValue: contractsApiSpy },
        { provide: AuthService, useValue: authServiceSpy },
        ValidationService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ContractFormComponent);
    component = fixture.componentInstance;
    mockContractsApi = TestBed.inject(ContractsApiService) as jasmine.SpyObj<ContractsApiService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Setup default mocks
    mockAuthService.hasPermission.and.returnValue(true);
    mockAuthService.getCurrentUser.and.returnValue({ id: '1', role: 'admin' });
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values for new contract', () => {
    component.ngOnInit();
    
    expect(component.contractForm).toBeDefined();
    expect(component.contractForm.get('numero')?.value).toBe('');
    expect(component.contractForm.get('cliente')?.value).toBe('');
    expect(component.isEditMode).toBeFalse();
  });

  it('should load contract data in edit mode', () => {
    component.contractId = '1';
    mockContractsApi.getContract.and.returnValue(of({ data: mockContract, success: true }));
    
    component.ngOnInit();
    
    expect(mockContractsApi.getContract).toHaveBeenCalledWith('1');
    expect(component.isEditMode).toBeTrue();
    expect(component.contractForm.get('numero')?.value).toBe(mockContract.numero);
    expect(component.contractForm.get('cliente')?.value).toBe(mockContract.cliente);
  });

  it('should validate required fields', () => {
    component.ngOnInit();
    
    const numeroControl = component.contractForm.get('numero');
    const clienteControl = component.contractForm.get('cliente');
    
    expect(numeroControl?.valid).toBeFalse();
    expect(clienteControl?.valid).toBeFalse();
    
    numeroControl?.setValue('CTR-2024-001');
    clienteControl?.setValue('Test Client');
    
    expect(numeroControl?.valid).toBeTrue();
    expect(clienteControl?.valid).toBeTrue();
  });

  it('should add performance obligation', () => {
    component.ngOnInit();
    const initialLength = component.performanceObligations.length;
    
    component.addPerformanceObligation();
    
    expect(component.performanceObligations.length).toBe(initialLength + 1);
  });

  it('should remove performance obligation', () => {
    component.ngOnInit();
    component.addPerformanceObligation();
    component.addPerformanceObligation();
    const initialLength = component.performanceObligations.length;
    
    component.removePerformanceObligation(0);
    
    expect(component.performanceObligations.length).toBe(initialLength - 1);
  });

  it('should not remove last performance obligation', () => {
    component.ngOnInit();
    component.addPerformanceObligation();
    
    component.removePerformanceObligation(0);
    
    expect(component.performanceObligations.length).toBe(1);
  });

  it('should calculate total allocated value correctly', () => {
    component.ngOnInit();
    component.addPerformanceObligation();
    component.addPerformanceObligation();
    
    component.performanceObligations.at(0).get('valorAlocado')?.setValue(30000);
    component.performanceObligations.at(1).get('valorAlocado')?.setValue(70000);
    
    expect(component.getTotalAllocatedValue()).toBe(100000);
  });

  it('should save new contract successfully', () => {
    component.ngOnInit();
    mockContractsApi.createContract.and.returnValue(of({ data: mockContract, success: true }));
    
    // Fill form with valid data
    component.contractForm.patchValue({
      numero: 'CTR-2024-001',
      cliente: 'Test Client',
      descricao: 'Test description',
      valorTotal: 100000,
      dataInicio: new Date('2024-01-01'),
      dataFim: new Date('2024-12-31')
    });
    
    component.save();
    
    expect(mockContractsApi.createContract).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
  });

  it('should update existing contract successfully', () => {
    component.contractId = '1';
    component.isEditMode = true;
    mockContractsApi.updateContract.and.returnValue(of({ data: mockContract, success: true }));
    
    component.ngOnInit();
    component.save();
    
    expect(mockContractsApi.updateContract).toHaveBeenCalledWith('1', jasmine.any(Object));
  });

  it('should handle save error', () => {
    component.ngOnInit();
    mockContractsApi.createContract.and.returnValue(throwError({ message: 'Save failed' }));
    
    component.contractForm.patchValue({
      numero: 'CTR-2024-001',
      cliente: 'Test Client',
      descricao: 'Test description',
      valorTotal: 100000
    });
    
    component.save();
    
    expect(component.loading).toBeFalse();
  });

  it('should validate IFRS 15 business rules', () => {
    component.ngOnInit();
    
    // Test contract with no commercial substance
    component.contractForm.patchValue({
      valorTotal: 0
    });
    
    expect(component.contractForm.valid).toBeFalse();
    
    // Test valid contract
    component.contractForm.patchValue({
      numero: 'CTR-2024-001',
      cliente: 'Test Client',
      descricao: 'Test description',
      valorTotal: 100000,
      dataInicio: new Date('2024-01-01'),
      dataFim: new Date('2024-12-31')
    });
    
    expect(component.contractForm.get('valorTotal')?.valid).toBeTrue();
  });

  it('should show/hide fields based on permissions', () => {
    mockAuthService.hasPermission.and.returnValue(false);
    
    component.ngOnInit();
    
    expect(component.canEdit()).toBeFalse();
  });

  it('should validate performance obligations distinctness', () => {
    component.ngOnInit();
    component.addPerformanceObligation();
    
    const poControl = component.performanceObligations.at(0);
    
    // Test insufficient description
    poControl.get('descricao')?.setValue('Short');
    expect(poControl.valid).toBeFalse();
    
    // Test valid description
    poControl.patchValue({
      descricao: 'Detailed software license with specific features',
      sspEstimado: 50000,
      metodoReconhecimento: 'point_in_time'
    });
    
    expect(poControl.get('descricao')?.valid).toBeTrue();
  });

  it('should handle variable consideration correctly', () => {
    component.ngOnInit();
    
    // Enable variable consideration
    component.contractForm.get('consideracaoVariavel')?.setValue(true);
    
    // Should require variable amount
    expect(component.contractForm.get('valorVariavel')?.hasError('required')).toBeTrue();
    
    // Set valid variable amount
    component.contractForm.get('valorVariavel')?.setValue(10000);
    expect(component.contractForm.get('valorVariavel')?.valid).toBeTrue();
  });

  it('should handle financing component correctly', () => {
    component.ngOnInit();
    
    // Enable financing component
    component.contractForm.get('componenteFinanciamento')?.setValue(true);
    
    // Should require discount rate
    expect(component.contractForm.get('taxaDesconto')?.hasError('required')).toBeTrue();
    
    // Set valid discount rate
    component.contractForm.get('taxaDesconto')?.setValue(5.5);
    expect(component.contractForm.get('taxaDesconto')?.valid).toBeTrue();
  });
});

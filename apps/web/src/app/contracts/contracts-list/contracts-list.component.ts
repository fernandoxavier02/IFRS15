import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ContractsApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/guards/rbac.guard';
import { ContractFormComponent } from '../contract-form/contract-form.component';

export interface Contract {
  id: string;
  numero: string;
  cliente: string;
  dataInicio: Date;
  dataFim: Date;
  valor: number;
  status: string;
  performanceObligations: number;
  revenueRecognized: number;
}

@Component({
  selector: 'app-contracts-list',
  templateUrl: './contracts-list.component.html',
  styleUrls: ['./contracts-list.component.scss']
})
export class ContractsListComponent implements OnInit {
  // Standard array instead of MatTableDataSource
  contracts: Contract[] = [];
  filteredContracts: Contract[] = [];
  loading = false;
  totalItems = 0;
  pageSize = 10;
  currentPage = 1;
  totalPages = 1;
  searchTerm = '';

  constructor(
    private contractsApi: ContractsApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadContracts();
  }

  loadContracts(): void {
    this.loading = true;
    
    this.contractsApi.getContracts(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.contracts = response.items || [];
          this.filteredContracts = [...this.contracts];
          this.totalItems = response.total || 0;
          this.totalPages = Math.ceil(this.totalItems / this.pageSize);
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading contracts:', error);
          this.loading = false;
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadContracts();
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value.toLowerCase();
    this.searchTerm = filterValue;
    
    if (filterValue) {
      this.filteredContracts = this.contracts.filter(contract =>
        contract.numero.toLowerCase().includes(filterValue) ||
        contract.cliente.toLowerCase().includes(filterValue) ||
        contract.status.toLowerCase().includes(filterValue)
      );
    } else {
      this.filteredContracts = [...this.contracts];
    }
  }

  openCreateDialog(): void {
    // Navigate to create form instead of using dialog
    this.router.navigate(['/contracts/new']);
  }

  openEditDialog(contract: Contract): void {
    // Navigate to edit form instead of using dialog
    this.router.navigate(['/contracts', contract.id, 'edit']);
  }

  viewContract(contract: Contract): void {
    this.router.navigate(['/contracts', contract.id]);
  }

  evaluateContract(contract: Contract): void {
    this.loading = true;
    
    this.contractsApi.evaluateContract(contract.id)
      .subscribe({
        next: (result) => {
          console.log('Contract evaluated:', result);
          this.loadContracts();
        },
        error: (error) => {
          console.error('Error evaluating contract:', error);
          this.loading = false;
        }
      });
  }

  canEdit(): boolean {
    return this.authService.hasPermission('contracts:write');
  }

  canDelete(): boolean {
    return this.authService.hasPermission('contracts:delete');
  }

  canEvaluate(): boolean {
    return this.authService.hasPermission('ifrs15:write');
  }

  deleteContract(contract: Contract): void {
    if (confirm(`Are you sure you want to delete contract ${contract.numero}?`)) {
      this.contractsApi.deleteContract(contract.id)
        .subscribe({
          next: () => {
            console.log('Contract deleted successfully');
            this.loadContracts();
          },
          error: (error) => {
            console.error('Error deleting contract:', error);
          }
        });
    }
  }

  getStatusColor(status: string): string {
    const colors = {
      'active': 'primary',
      'completed': 'accent',
      'cancelled': 'warn',
      'draft': 'basic'
    };
    return colors[status as keyof typeof colors] || 'basic';
  }
}

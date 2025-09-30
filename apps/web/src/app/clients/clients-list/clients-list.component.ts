import { Component, OnInit, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ClientsApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/guards/rbac.guard';

export interface Client {
  id: string;
  nome: string;
  documento: string;
  email: string;
  telefone: string;
  endereco: string;
  status: 'ativo' | 'inativo' | 'suspenso';
  totalContratos: number;
  valorTotal: number;
  createdAt: Date;
  updatedAt: Date;
}

@Component({
  selector: 'app-clients-list',
  templateUrl: './clients-list.component.html',
  styleUrls: ['./clients-list.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ClientsListComponent implements OnInit {
  // Remove mat-table related properties
  // @ViewChild(MatPaginator) paginator!: MatPaginator;
  // @ViewChild(MatSort) sort!: MatSort;

  // Remove displayedColumns property since we're not using mat-table anymore
  // displayedColumns: string[] = [
  //   'nome', 
  //   'documento', 
  //   'email', 
  //   'status', 
  //   'totalContratos', 
  //   'valorTotal', 
  //   'actions'
  // ];
  
  // Standard array instead of MatTableDataSource
  clients: Client[] = [];
  filteredClients: Client[] = [];
  loading = false;
  searchTerm = '';
  statusFilter = '';
  
  // Pagination properties
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  totalPages = 1;
  pageSizeOptions = [5, 10, 25, 50];

  // Status options
  statusOptions = [
    { value: '', label: 'Todos' },
    { value: 'ativo', label: 'Ativo' },
    { value: 'inativo', label: 'Inativo' },
    { value: 'suspenso', label: 'Suspenso' }
  ];

  constructor(
    private apiService: ClientsApiService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadClients();
  }

  ngAfterViewInit(): void {
    // Remove mat-table related initialization
    // this.dataSource.paginator = this.paginator;
    // this.dataSource.sort = this.sort;
  }

  loadClients(): void {
    this.loading = true;
    
    const filters = {
      search: this.searchTerm,
      status: this.statusFilter
    };

    this.apiService.getClients(this.currentPage, this.pageSize, filters).subscribe({
      next: (response) => {
        this.clients = response.items || [];
        this.filteredClients = [...this.clients];
        this.totalItems = response.total || 0;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar clientes:', error);
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    this.currentPage = 1; // Reset to first page when filtering
    this.loadClients();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.applyFilter();
  }

  // Pagination methods
  get Math() {
    return Math;
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadClients();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadClients();
    }
  }

  onPageChange(): void {
    this.loadClients();
  }

  onStatusFilterChange(): void {
    this.currentPage = 1; // Reset to first page when filtering
    this.loadClients();
  }

  // Actions
  canCreate(): boolean {
    return this.authService.hasPermission('clients:create');
  }

  canEdit(): boolean {
    return this.authService.hasPermission('clients:update');
  }

  canDelete(): boolean {
    return this.authService.hasPermission('clients:delete');
  }

  canView(): boolean {
    return this.authService.hasPermission('clients:read');
  }

  addClient(): void {
    this.router.navigate(['/clients/new']);
  }

  changeStatus(client: Client): void {
    this.toggleClientStatus(client);
  }

  getActiveClientsCount(): number {
    return this.filteredClients.filter(client => client.status === 'ativo').length;
  }

  getTotalContracts(): number {
    return this.filteredClients.reduce((total, client) => total + client.totalContratos, 0);
  }

  getTotalValue(): number {
    return this.filteredClients.reduce((total, client) => total + client.valorTotal, 0);
  }

  editClient(client: Client): void {
    this.router.navigate(['/clients', client.id, 'edit']);
  }

  viewClient(client: Client): void {
    this.router.navigate(['/clients', client.id]);
  }

  deleteClient(client: Client): void {
    const confirmed = confirm(`Tem certeza que deseja excluir o cliente "${client.nome}"?`);
    
    if (confirmed) {
      // Simulating API call - in a real app, this would call the API
      const index = this.clients.findIndex(c => c.id === client.id);
      if (index > -1) {
        this.clients.splice(index, 1);
        this.filteredClients = [...this.clients];
        console.log('Cliente excluído com sucesso!');
      }
    }
  }

  toggleClientStatus(client: Client): void {
    const newStatus = client.status === 'ativo' ? 'inativo' : 'ativo';
    
    // Simulating API call - in a real app, this would call the API
    client.status = newStatus;
    console.log(`Status do cliente alterado para ${newStatus}!`);
  }

  viewContracts(client: Client): void {
    this.router.navigate(['/contracts'], { queryParams: { clientId: client.id } });
  }

  // Utility methods
  getStatusColor(status: string): string {
    switch (status) {
      case 'ativo': return 'primary';
      case 'inativo': return 'accent';
      case 'suspenso': return 'warn';
      default: return '';
    }
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'ativo': return 'check_circle';
      case 'inativo': return 'radio_button_unchecked';
      case 'suspenso': return 'block';
      default: return 'help';
    }
  }

  exportClients(): void {
    this.loading = true;
    
    this.apiService.exportClients().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.loading = false;
        console.log('Relatório exportado com sucesso!');
      },
      error: (error) => {
        // Fallback to CSV export if API fails
        const exportData = this.filteredClients.map(client => ({
          Nome: client.nome,
          Documento: client.documento,
          Email: client.email,
          Telefone: client.telefone,
          Status: client.status,
          'Total Contratos': client.totalContratos,
          'Valor Total': client.valorTotal
        }));

        const csvContent = this.convertToCSV(exportData);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `clientes_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        window.URL.revokeObjectURL(url);
        
        this.loading = false;
        console.log('Relatório exportado como CSV (fallback)');
      }
    });
  }

  private convertToCSV(data: any[]): string {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
    ];
    
    return csvRows.join('\n');
  }
}

// Simple confirmation component (no longer needed as we use browser confirm)
// Removed ConfirmDialogComponent as it's no longer used

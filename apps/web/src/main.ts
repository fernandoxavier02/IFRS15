import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideRouter } from '@angular/router';
import { importProvidersFrom } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';

import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

const routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' as const },
  { path: 'dashboard', loadComponent: () => import('./app/dashboard/dashboard.component').then(m => m.DashboardComponent) },
  { path: 'contracts', loadComponent: () => import('./app/contracts/contracts.component').then(m => m.ContractsComponent) },
  { path: 'contracts/new', loadComponent: () => import('./app/contracts/contract-form/contract-form.component').then(m => m.ContractFormComponent) },
  { path: 'contracts/:id', loadComponent: () => import('./app/contracts/contract-form/contract-form.component').then(m => m.ContractFormComponent) },
  { path: 'contracts/:id/edit', loadComponent: () => import('./app/contracts/contract-form/contract-form.component').then(m => m.ContractFormComponent) },
  { path: 'revenue', loadComponent: () => import('./app/revenue/revenue.component').then(m => m.RevenueComponent) },
  { path: 'clients', loadComponent: () => import('./app/clients/clients-list/clients-list.component').then(m => m.ClientsListComponent) },
  { path: 'clients/new', loadComponent: () => import('./app/clients/client-form/client-form.component').then(m => m.ClientFormComponent) },
  { path: 'clients/:id', loadComponent: () => import('./app/clients/client-form/client-form.component').then(m => m.ClientFormComponent) },
  { path: 'clients/:id/edit', loadComponent: () => import('./app/clients/client-form/client-form.component').then(m => m.ClientFormComponent) },
];

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideAnimations(),
    provideHttpClient(withInterceptorsFromDi()),
    importProvidersFrom(
      BrowserAnimationsModule,
      HttpClientModule
    )
  ]
}).catch(err => console.error(err));

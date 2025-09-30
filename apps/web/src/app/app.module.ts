import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

// Application Components
import { AppComponent } from './app.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ContractsComponent } from './contracts/contracts.component';
import { ContractsListComponent } from './contracts/contracts-list/contracts-list.component';
import { ContractFormComponent } from './contracts/contract-form/contract-form.component';
import { ClientsListComponent } from './clients/clients-list/clients-list.component';
import { RevenueComponent } from './revenue/revenue.component';
import { RevenueChartComponent } from './charts/revenue-chart/revenue-chart.component';
import { ContractWizardComponent } from './wizards/contract-wizard/contract-wizard.component';
import { ConfirmDialogComponent } from './clients/clients-list/clients-list.component';

// Services
import { ApiService, ClientsApiService, ContractsApiService, DACApiService, PoliciesApiService } from './shared/services/api.service';
import { AuthService } from './shared/guards/rbac.guard';
import { ValidationService } from './shared/services/validation.service';
import { I18nService } from './shared/services/i18n.service';

// Guards
import { RBACGuard } from './shared/guards/rbac.guard';

const routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'contracts', component: ContractsListComponent },
  { path: 'contracts/new', component: ContractFormComponent },
  { path: 'contracts/:id', component: ContractFormComponent },
  { path: 'clients', component: ClientsListComponent },
  { path: 'revenue', component: RevenueComponent },
  { path: 'wizard', component: ContractWizardComponent }
];

@NgModule({
  declarations: [
    AppComponent,
    DashboardComponent,
    ContractsComponent,
    ContractsListComponent,
    ContractFormComponent,
    RevenueComponent,
    RevenueChartComponent,
    ContractWizardComponent,
    ConfirmDialogComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes)
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [
    ApiService,
    ClientsApiService,
    ContractsApiService,
    DACApiService,
    PoliciesApiService,
    AuthService,
    ValidationService,
    I18nService,
    RBACGuard
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
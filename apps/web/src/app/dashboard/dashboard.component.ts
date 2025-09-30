import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  contractsCount = 25;
  totalRevenue = 2500000;
  performanceObligations = 42;
  clientsCount = 18;

  ngOnInit() {
    // Mock data loaded
  }
}

import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subject, takeUntil, filter } from 'rxjs';

export interface BreadcrumbItem {
  label: string;
  url?: string;
  icon?: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <nav class="breadcrumb-container" aria-label="Breadcrumb">
      <ol class="breadcrumb-list">
        <li 
          *ngFor="let item of breadcrumbs; let last = last; let i = index"
          class="breadcrumb-item"
          [ngClass]="{ 'active': last, 'disabled': item.disabled }">
          
          <!-- Home icon for first item -->
          <mat-icon 
            *ngIf="i === 0 && showHomeIcon" 
            class="breadcrumb-home-icon">
            home
          </mat-icon>
          
          <!-- Item icon -->
          <mat-icon 
            *ngIf="item.icon && (i !== 0 || !showHomeIcon)" 
            class="breadcrumb-icon">
            {{ item.icon }}
          </mat-icon>
          
          <!-- Clickable link -->
          <button 
            *ngIf="item.url && !last && !item.disabled"
            mat-button
            class="breadcrumb-link"
            (click)="navigate(item.url!)"
            [attr.aria-label]="'Navegar para ' + item.label">
            {{ item.label }}
          </button>
          
          <!-- Current page (not clickable) -->
          <span 
            *ngIf="last || !item.url || item.disabled"
            class="breadcrumb-current"
            [attr.aria-current]="last ? 'page' : null">
            {{ item.label }}
          </span>
          
          <!-- Separator -->
          <mat-icon 
            *ngIf="!last" 
            class="breadcrumb-separator"
            aria-hidden="true">
            {{ separatorIcon }}
          </mat-icon>
        </li>
      </ol>
    </nav>
  `,
  styles: [`
    .breadcrumb-container {
      padding: 8px 0;
      border-bottom: 1px solid #e0e0e0;
      background: #fafafa;
    }

    .breadcrumb-list {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .breadcrumb-item {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .breadcrumb-item.disabled {
      opacity: 0.6;
      pointer-events: none;
    }

    .breadcrumb-home-icon,
    .breadcrumb-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
      color: #666;
    }

    .breadcrumb-link {
      font-size: 14px;
      font-weight: 400;
      text-transform: none;
      color: #1976d2;
      padding: 4px 8px;
      min-width: auto;
      height: auto;
      line-height: 1.2;
      border-radius: 4px;
    }

    .breadcrumb-link:hover {
      background-color: rgba(25, 118, 210, 0.04);
      text-decoration: underline;
    }

    .breadcrumb-current {
      font-size: 14px;
      font-weight: 500;
      color: #333;
      padding: 4px 8px;
    }

    .breadcrumb-item.active .breadcrumb-current {
      color: #1976d2;
    }

    .breadcrumb-separator {
      font-size: 14px;
      width: 14px;
      height: 14px;
      color: #999;
      margin: 0 2px;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .breadcrumb-container {
        padding: 6px 0;
      }

      .breadcrumb-list {
        gap: 2px;
      }

      .breadcrumb-link,
      .breadcrumb-current {
        font-size: 13px;
        padding: 2px 6px;
      }

      .breadcrumb-home-icon,
      .breadcrumb-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }

      .breadcrumb-separator {
        font-size: 12px;
        width: 12px;
        height: 12px;
      }
    }

    /* Compact mode */
    .breadcrumb-container.compact {
      padding: 4px 0;
      border-bottom: none;
      background: transparent;
    }

    .breadcrumb-container.compact .breadcrumb-link,
    .breadcrumb-container.compact .breadcrumb-current {
      font-size: 12px;
      padding: 2px 4px;
    }

    /* Dark theme support */
    .breadcrumb-container.dark {
      background: #303030;
      border-bottom-color: #424242;
    }

    .breadcrumb-container.dark .breadcrumb-current {
      color: #fff;
    }

    .breadcrumb-container.dark .breadcrumb-item.active .breadcrumb-current {
      color: #90caf9;
    }

    .breadcrumb-container.dark .breadcrumb-link {
      color: #90caf9;
    }

    .breadcrumb-container.dark .breadcrumb-link:hover {
      background-color: rgba(144, 202, 249, 0.08);
    }
  `]
})
export class BreadcrumbComponent implements OnInit, OnDestroy {
  @Input() breadcrumbs: BreadcrumbItem[] = [];
  @Input() autoGenerate: boolean = true;
  @Input() showHomeIcon: boolean = true;
  @Input() separatorIcon: string = 'chevron_right';
  @Input() homeLabel: string = 'Início';
  @Input() homeUrl: string = '/';
  @Input() maxItems: number = 5;
  @Input() compact: boolean = false;
  @Input() theme: 'light' | 'dark' = 'light';

  private destroy$ = new Subject<void>();

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute
  ) {}

  ngOnInit(): void {
    if (this.autoGenerate) {
      this.generateBreadcrumbs();
      
      // Listen to route changes
      this.router.events
        .pipe(
          filter(event => event instanceof NavigationEnd),
          takeUntil(this.destroy$)
        )
        .subscribe(() => {
          this.generateBreadcrumbs();
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  navigate(url: string): void {
    this.router.navigate([url]);
  }

  private generateBreadcrumbs(): void {
    const breadcrumbs: BreadcrumbItem[] = [];
    let route = this.activatedRoute.root;
    let url = '';

    // Add home breadcrumb
    breadcrumbs.push({
      label: this.homeLabel,
      url: this.homeUrl,
      icon: 'home'
    });

    while (route) {
      if (route.snapshot.data['breadcrumb']) {
        url += '/' + route.snapshot.url.map(segment => segment.path).join('/');
        
        const breadcrumbData = route.snapshot.data['breadcrumb'];
        const label = typeof breadcrumbData === 'string' ? breadcrumbData : breadcrumbData.label;
        const icon = typeof breadcrumbData === 'object' ? breadcrumbData.icon : undefined;
        
        breadcrumbs.push({
          label,
          url: url || undefined,
          icon
        });
      }
      
      route = route.firstChild;
    }

    // Limit breadcrumbs if maxItems is set
    if (this.maxItems > 0 && breadcrumbs.length > this.maxItems) {
      const firstItem = breadcrumbs[0];
      const lastItems = breadcrumbs.slice(-this.maxItems + 2);
      
      this.breadcrumbs = [
        firstItem,
        { label: '...', disabled: true },
        ...lastItems
      ];
    } else {
      this.breadcrumbs = breadcrumbs;
    }
  }

  get containerClasses(): string {
    const classes = ['breadcrumb-container'];
    
    if (this.compact) {
      classes.push('compact');
    }
    
    if (this.theme === 'dark') {
      classes.push('dark');
    }
    
    return classes.join(' ');
  }
}
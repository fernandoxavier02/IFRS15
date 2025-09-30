import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';

export enum UserRole {
  ADMIN_ORG = 'admin_org',
  GERENTE_FINANCEIRO = 'gerente_financeiro',
  CONTABILIDADE = 'contabilidade',
  AUDITOR_EXTERNO = 'auditor_externo',
  CLIENTE = 'cliente'
}

@Injectable({
  providedIn: 'root'
})
export class RBACGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const user = this.authService.getCurrentUser();
    
    if (!user) {
      this.router.navigate(['/login']);
      return false;
    }

    const requiredRoles = route.data['roles'] as UserRole[];
    const requiredPermissions = route.data['permissions'] as string[];

    if (requiredRoles && !this.hasRole(user.role, requiredRoles)) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    if (requiredPermissions && !this.hasPermissions(user.role, requiredPermissions)) {
      this.router.navigate(['/unauthorized']);
      return false;
    }

    return true;
  }

  private hasRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole) || userRole === UserRole.ADMIN_ORG;
  }

  private hasPermissions(userRole: UserRole, requiredPermissions: string[]): boolean {
    const rolePermissions = this.getRolePermissions(userRole);
    
    if (rolePermissions.includes('*')) return true;
    
    return requiredPermissions.every(permission => 
      rolePermissions.includes(permission) || 
      rolePermissions.includes(permission.split(':')[0] + ':*')
    );
  }

  private getRolePermissions(role: UserRole): string[] {
    const permissions = {
      [UserRole.ADMIN_ORG]: ['*'],
      [UserRole.GERENTE_FINANCEIRO]: [
        'ifrs15:read', 'ifrs15:write', 'policies:read', 'policies:write',
        'contracts:read', 'contracts:write', 'revenue:read', 'revenue:write',
        'dac:read', 'dac:write', 'reports:read'
      ],
      [UserRole.CONTABILIDADE]: [
        'contracts:read', 'contracts:write', 'contracts:reestimate',
        'revenue:read', 'revenue:write', 'revenue:reprocess',
        'dac:read', 'dac:write', 'invoicing:read', 'invoicing:write',
        'reports:read'
      ],
      [UserRole.AUDITOR_EXTERNO]: [
        'contracts:read', 'revenue:read', 'dac:read', 'policies:read',
        'reports:read', 'snapshots:read', 'audit:read'
      ],
      [UserRole.CLIENTE]: [
        'contracts:read:own', 'revenue:read:own', 'invoices:read:own',
        'reports:read:own'
      ]
    };

    return permissions[role] || [];
  }
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUser: any = null;

  constructor() {
    this.loadUserFromStorage();
  }

  getCurrentUser(): any {
    return this.currentUser;
  }

  setCurrentUser(user: any): void {
    this.currentUser = user;
    localStorage.setItem('current_user', JSON.stringify(user));
  }

  logout(): void {
    this.currentUser = null;
    localStorage.removeItem('current_user');
    localStorage.removeItem('access_token');
  }

  private loadUserFromStorage(): void {
    const userData = localStorage.getItem('current_user');
    if (userData) {
      this.currentUser = JSON.parse(userData);
    }
  }

  hasRole(role: UserRole): boolean {
    return this.currentUser?.role === role || this.currentUser?.role === UserRole.ADMIN_ORG;
  }

  hasPermission(permission: string): boolean {
    if (!this.currentUser) return false;
    
    const guard = new RBACGuard(this, null as any);
    return (guard as any).hasPermissions(this.currentUser.role, [permission]);
  }
}

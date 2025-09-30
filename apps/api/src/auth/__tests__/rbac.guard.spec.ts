import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RBACGuard, AuthenticatedUser } from '../guards/rbac.guard';
import { UserRole } from '../enums/user-role.enum';

describe('RBACGuard', () => {
  let guard: RBACGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RBACGuard,
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn()
          }
        }
      ]
    }).compile();

    guard = module.get<RBACGuard>(RBACGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockContext = (user?: AuthenticatedUser, params?: any, query?: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          user,
          params: params || {},
          query: query || {},
          body: {}
        })
      }),
      getHandler: jest.fn(),
      getClass: jest.fn()
    } as any;
  };

  const createMockUser = (role: UserRole, tenantId = 'tenant-1', contractIds?: string[]): AuthenticatedUser => ({
    id: 'user-1',
    email: 'test@example.com',
    role,
    tenantId,
    contractIds
  });

  describe('canActivate', () => {
    it('should allow access when no permissions required', () => {
      jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
      const context = createMockContext();

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should throw ForbiddenException when user not authenticated', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:read'])
        .mockReturnValueOnce(false);
      
      const context = createMockContext();

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow admin_org access to all permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:write', 'revenue:write'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.ADMIN_ORG);
      const context = createMockContext(user);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow gerente_financeiro access to IFRS15 permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['ifrs15:write', 'policies:write'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.GERENTE_FINANCEIRO);
      const context = createMockContext(user);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny gerente_financeiro access to admin permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['admin:delete'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.GERENTE_FINANCEIRO);
      const context = createMockContext(user);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow contabilidade access to operational permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:write', 'revenue:reprocess'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.CONTABILIDADE);
      const context = createMockContext(user);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow auditor_externo only read permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:read', 'reports:read'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.AUDITOR_EXTERNO);
      const context = createMockContext(user);

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny auditor_externo write permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:write'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.AUDITOR_EXTERNO);
      const context = createMockContext(user);

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow cliente access to own resources', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:read:own'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.CLIENTE, 'tenant-1', ['contract-1', 'contract-2']);
      const context = createMockContext(user, { id: 'contract-1' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny cliente access to other resources', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:read:own'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.CLIENTE, 'tenant-1', ['contract-1']);
      const context = createMockContext(user, { id: 'contract-3' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should validate tenant access when required', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:read'])
        .mockReturnValueOnce(true);

      const user = createMockUser(UserRole.GERENTE_FINANCEIRO, 'tenant-1');
      const context = createMockContext(user, { tenantId: 'tenant-2' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });

    it('should allow same tenant access', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:read'])
        .mockReturnValueOnce(true);

      const user = createMockUser(UserRole.GERENTE_FINANCEIRO, 'tenant-1');
      const context = createMockContext(user, { tenantId: 'tenant-1' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should inject tenant context into request', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:read'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.GERENTE_FINANCEIRO);
      const mockRequest = { user, params: {}, query: {}, body: {} };
      const context = {
        switchToHttp: () => ({ getRequest: () => mockRequest }),
        getHandler: jest.fn(),
        getClass: jest.fn()
      } as any;

      guard.canActivate(context);

      expect(mockRequest.tenantId).toBe('tenant-1');
      expect(mockRequest.userRole).toBe(UserRole.GERENTE_FINANCEIRO);
    });
  });

  describe('checkOwnResourceAccess', () => {
    it('should allow access to own contracts', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:read:own'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.CLIENTE, 'tenant-1', ['contract-123']);
      const context = createMockContext(user, { id: 'contract-123' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access to revenue of own contracts', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['revenue:read:own'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.CLIENTE, 'tenant-1', ['contract-123']);
      const context = createMockContext(user, { contractId: 'contract-123' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny access to revenue of other contracts', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['revenue:read:own'])
        .mockReturnValueOnce(false);

      const user = createMockUser(UserRole.CLIENTE, 'tenant-1', ['contract-123']);
      const context = createMockContext(user, { contractId: 'contract-456' });

      expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    });
  });

  describe('wildcard permissions', () => {
    it('should allow wildcard resource permissions', () => {
      jest.spyOn(reflector, 'getAllAndOverride')
        .mockReturnValueOnce(['contracts:delete'])
        .mockReturnValueOnce(false);

      // Mock user with contracts:* permission
      const user = createMockUser(UserRole.GERENTE_FINANCEIRO);
      const context = createMockContext(user);

      expect(guard.canActivate(context)).toBe(true);
    });
  });
});

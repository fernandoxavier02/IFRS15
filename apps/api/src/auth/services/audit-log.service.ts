import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

export interface AuditLogEntry {
  tenantId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditContext {
  tenantId: string;
  userId: string;
  userEmail: string;
  userRole: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditLogService {
  constructor(private prisma: PrismaService) {}

  async logCreate(
    context: AuditContext,
    resource: string,
    resourceId: string,
    newValues: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.createAuditEntry({
      ...context,
      action: 'CREATE',
      resource,
      resourceId,
      newValues,
      metadata,
      timestamp: new Date()
    });
  }

  async logUpdate(
    context: AuditContext,
    resource: string,
    resourceId: string,
    oldValues: Record<string, any>,
    newValues: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.createAuditEntry({
      ...context,
      action: 'UPDATE',
      resource,
      resourceId,
      oldValues,
      newValues,
      metadata,
      timestamp: new Date()
    });
  }

  async logDelete(
    context: AuditContext,
    resource: string,
    resourceId: string,
    oldValues: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.createAuditEntry({
      ...context,
      action: 'DELETE',
      resource,
      resourceId,
      oldValues,
      metadata,
      timestamp: new Date()
    });
  }

  async logRead(
    context: AuditContext,
    resource: string,
    resourceId: string,
    metadata?: Record<string, any>
  ): Promise<void> {
    // Only log sensitive reads (for audit purposes)
    if (this.shouldLogRead(resource)) {
      await this.createAuditEntry({
        ...context,
        action: 'READ',
        resource,
        resourceId,
        metadata,
        timestamp: new Date()
      });
    }
  }

  async logCustomAction(
    context: AuditContext,
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.createAuditEntry({
      ...context,
      action: action.toUpperCase(),
      resource,
      resourceId,
      newValues: details,
      metadata,
      timestamp: new Date()
    });
  }

  async getAuditTrail(
    tenantId: string,
    filters?: {
      userId?: string;
      resource?: string;
      resourceId?: string;
      action?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      offset?: number;
    }
  ): Promise<any[]> {
    const where: any = { tenantId };

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.resource) where.resource = filters.resource;
    if (filters?.resourceId) where.resourceId = filters.resourceId;
    if (filters?.action) where.action = filters.action;
    if (filters?.startDate || filters?.endDate) {
      where.timestamp = {};
      if (filters.startDate) where.timestamp.gte = filters.startDate;
      if (filters.endDate) where.timestamp.lte = filters.endDate;
    }

    return this.prisma.trilhaEventos.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filters?.limit || 100,
      skip: filters?.offset || 0,
      include: {
        usuario: {
          select: {
            id: true,
            email: true,
            nome: true
          }
        }
      }
    });
  }

  private async createAuditEntry(entry: AuditLogEntry): Promise<void> {
    try {
      await this.prisma.trilhaEventos.create({
        data: {
          tenantId: entry.tenantId,
          userId: entry.userId,
          userEmail: entry.userEmail,
          userRole: entry.userRole,
          action: entry.action,
          resource: entry.resource,
          resourceId: entry.resourceId,
          oldValues: entry.oldValues ? JSON.stringify(entry.oldValues) : null,
          newValues: entry.newValues ? JSON.stringify(entry.newValues) : null,
          metadata: entry.metadata ? JSON.stringify(entry.metadata) : null,
          timestamp: entry.timestamp,
          ipAddress: entry.ipAddress,
          userAgent: entry.userAgent
        }
      });
    } catch (error) {
      // Log error but don't fail the main operation
      console.error('Failed to create audit log entry:', error);
    }
  }

  private shouldLogRead(resource: string): boolean {
    // Define which resources should have read operations logged
    const sensitiveResources = [
      'contracts',
      'revenue',
      'financial_reports',
      'audit_reports',
      'policies'
    ];
    return sensitiveResources.includes(resource);
  }
}

// Decorator for automatic audit logging
export function AuditLog(resource: string, action?: string) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const auditService: AuditLogService = this.auditLogService || this.auditLog;
      const request = this.getRequest?.() || args.find(arg => arg?.user);
      
      if (auditService && request?.user) {
        const context: AuditContext = {
          tenantId: request.tenantId || request.user.tenantId,
          userId: request.user.id,
          userEmail: request.user.email,
          userRole: request.user.role,
          ipAddress: request.ip,
          userAgent: request.get?.('User-Agent')
        };

        const resourceId = args[0]?.id || args[0] || 'unknown';
        const actionType = action || propertyName.toUpperCase();

        try {
          const result = await method.apply(this, args);
          
          // Log successful operation
          if (actionType.includes('CREATE')) {
            await auditService.logCreate(context, resource, resourceId, result);
          } else if (actionType.includes('UPDATE')) {
            await auditService.logUpdate(context, resource, resourceId, {}, result);
          } else if (actionType.includes('DELETE')) {
            await auditService.logDelete(context, resource, resourceId, {});
          }
          
          return result;
        } catch (error) {
          // Log failed operation
          await auditService.logCustomAction(
            context,
            `${actionType}_FAILED`,
            resource,
            resourceId,
            { error: error.message }
          );
          throw error;
        }
      }

      return method.apply(this, args);
    };
  };
}

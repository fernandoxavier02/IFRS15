import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  /**
   * Set tenant context for RLS (Row Level Security)
   * This should be called at the beginning of each request
   */
  async setTenantContext(tenantId: string): Promise<void> {
    await this.prisma.$executeRaw`SET app.current_tenant_id = ${tenantId}`;
  }

  /**
   * Clear tenant context
   */
  async clearTenantContext(): Promise<void> {
    await this.prisma.$executeRaw`SET app.current_tenant_id = ''`;
  }

  /**
   * Get current tenant context
   */
  async getCurrentTenantId(): Promise<string | null> {
    const result = await this.prisma.$queryRaw<Array<{ current_setting: string }>>`
      SELECT current_setting('app.current_tenant_id', true) as current_setting
    `;
    return result[0]?.current_setting || null;
  }

  /**
   * Validate tenant access for user
   */
  async validateTenantAccess(userId: string, tenantId: string): Promise<boolean> {
    const userTenant = await this.prisma.usuarioTenant.findFirst({
      where: {
        usuarioId: userId,
        tenantId: tenantId,
        ativo: true
      }
    });
    return !!userTenant;
  }

  /**
   * Get user's accessible tenants
   */
  async getUserTenants(userId: string): Promise<any[]> {
    return this.prisma.usuarioTenant.findMany({
      where: {
        usuarioId: userId,
        ativo: true
      },
      include: {
        tenant: {
          select: {
            id: true,
            nome: true,
            codigo: true,
            ativo: true
          }
        }
      }
    });
  }

  /**
   * Create tenant isolation middleware
   */
  createTenantMiddleware() {
    return async (req: any, res: any, next: any) => {
      if (req.user?.tenantId) {
        await this.setTenantContext(req.user.tenantId);
        
        // Cleanup on response end
        res.on('finish', async () => {
          await this.clearTenantContext();
        });
      }
      next();
    };
  }
}

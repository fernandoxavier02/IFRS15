import { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
    await this.enableRLS();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  // Enable Row Level Security policies
  private async enableRLS() {
    // Enable RLS on all tenant-scoped tables
    await this.$executeRawUnsafe('ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;');
    await this.$executeRawUnsafe('ALTER TABLE users ENABLE ROW LEVEL SECURITY;');
    await this.$executeRawUnsafe('ALTER TABLE customers ENABLE ROW LEVEL SECURITY;');
    await this.$executeRawUnsafe('ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;');
    await this.$executeRawUnsafe('ALTER TABLE performance_obligations ENABLE ROW LEVEL SECURITY;');
    await this.$executeRawUnsafe('ALTER TABLE revenue_recognitions ENABLE ROW LEVEL SECURITY;');
    await this.$executeRawUnsafe('ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;');
  }

  // Set tenant context for RLS
  async setTenantContext(tenantId: string) {
    await this.$executeRawUnsafe(`SET app.current_tenant_id = '${tenantId}';`);
  }

  // Clear tenant context
  async clearTenantContext() {
    await this.$executeRawUnsafe('RESET app.current_tenant_id;');
  }

  // Execute within tenant context
  async withTenant<T>(tenantId: string, operation: () => Promise<T>): Promise<T> {
    await this.setTenantContext(tenantId);
    try {
      return await operation();
    } finally {
      await this.clearTenantContext();
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
}

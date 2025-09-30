import { PrismaService } from './prisma.service';
import { readFileSync } from 'fs';
import { join } from 'path';

export class RLSPoliciesService {
  constructor(private prisma: PrismaService) {}

  async applyPolicies(): Promise<void> {
    const sqlPath = join(__dirname, 'rls-policies.sql');
    const sql = readFileSync(sqlPath, 'utf-8');
    
    // Split SQL statements and execute them
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    for (const statement of statements) {
      try {
        await this.prisma.$executeRawUnsafe(statement + ';');
      } catch (error) {
        console.error(`Error executing SQL statement: ${statement}`);
        console.error(error);
        throw error;
      }
    }
  }

  async validatePolicies(): Promise<boolean> {
    try {
      // Test that RLS is enabled on key tables
      const rlsCheck = await this.prisma.$queryRaw<Array<{ tablename: string; rowsecurity: boolean }>>`
        SELECT tablename, rowsecurity 
        FROM pg_tables t
        JOIN pg_class c ON c.relname = t.tablename
        WHERE t.schemaname = 'public' 
        AND t.tablename IN ('tenants', 'users', 'customers', 'contracts', 'revenue_recognitions')
      `;

      const allTablesHaveRLS = rlsCheck.every(table => table.rowsecurity);
      
      if (!allTablesHaveRLS) {
        console.error('Not all tables have RLS enabled');
        return false;
      }

      // Test that policies exist
      const policyCheck = await this.prisma.$queryRaw<Array<{ count: number }>>`
        SELECT COUNT(*) as count
        FROM pg_policies 
        WHERE schemaname = 'public'
      `;

      const hasPolicies = policyCheck[0]?.count > 0;
      
      if (!hasPolicies) {
        console.error('No RLS policies found');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error validating RLS policies:', error);
      return false;
    }
  }
}

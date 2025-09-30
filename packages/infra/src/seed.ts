import { PrismaClient } from '@prisma/client';
import { RLSPoliciesService } from './database/rls-policies';
import { PrismaService } from './database/prisma.service';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Apply RLS policies first
  const rlsService = new RLSPoliciesService(prisma as PrismaService);
  await rlsService.applyPolicies();
  console.log('✅ RLS policies applied');

  // Create demo tenant
  const tenant = await prisma.tenant.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Demo Company Ltd',
      domain: 'demo.ifrs15.com',
      settings: {
        currency: 'BRL',
        locale: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        fiscalYearStart: 1,
      },
    },
  });

  console.log('✅ Demo tenant created');

  // Set tenant context for RLS
  await prisma.$executeRawUnsafe(`SET app.current_tenant_id = '${tenant.id}';`);

  // Create demo users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440001',
        tenantId: tenant.id,
        email: 'admin@demo.com',
        name: 'Admin User',
        roles: ['admin_org'],
      },
    }),
    prisma.user.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440002',
        tenantId: tenant.id,
        email: 'financeiro@demo.com',
        name: 'Gerente Financeiro',
        roles: ['gerente_financeiro'],
      },
    }),
    prisma.user.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440003',
        tenantId: tenant.id,
        email: 'contabilidade@demo.com',
        name: 'Contador',
        roles: ['contabilidade'],
      },
    }),
  ]);

  console.log('✅ Demo users created');

  // Create demo customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440010',
        tenantId: tenant.id,
        name: 'Cliente ABC Ltda',
        email: 'contato@clienteabc.com',
        taxId: '12.345.678/0001-90',
        address: {
          street: 'Rua das Flores, 123',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01234-567',
          country: 'Brasil',
        },
      },
    }),
    prisma.customer.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440011',
        tenantId: tenant.id,
        name: 'Empresa XYZ S.A.',
        email: 'financeiro@xyz.com',
        taxId: '98.765.432/0001-10',
        address: {
          street: 'Av. Paulista, 1000',
          city: 'São Paulo',
          state: 'SP',
          zipCode: '01310-100',
          country: 'Brasil',
        },
      },
    }),
  ]);

  console.log('✅ Demo customers created');

  // Create demo contracts with performance obligations
  const contract1 = await prisma.contract.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440020',
      tenantId: tenant.id,
      customerId: customers[0].id,
      contractNumber: 'CONT-2024-001',
      title: 'Implementação de Sistema ERP',
      description: 'Contrato para implementação completa de sistema ERP incluindo licenças, customização e treinamento',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      totalValue: 500000.00,
      currency: 'BRL',
      status: 'ACTIVE',
      performanceObligations: {
        create: [
          {
            id: '550e8400-e29b-41d4-a716-446655440030',
            description: 'Licenças de Software',
            allocatedAmount: 200000.00,
            recognizedAmount: 200000.00, // Recognized at point in time
            isDistinct: true,
            satisfactionMethod: 'POINT_IN_TIME',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440031',
            description: 'Implementação e Customização',
            allocatedAmount: 250000.00,
            recognizedAmount: 125000.00, // 50% complete
            isDistinct: true,
            satisfactionMethod: 'OVER_TIME',
            estimatedCompletionDate: new Date('2024-10-31'),
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440032',
            description: 'Treinamento de Usuários',
            allocatedAmount: 50000.00,
            recognizedAmount: 0.00,
            isDistinct: true,
            satisfactionMethod: 'OVER_TIME',
            estimatedCompletionDate: new Date('2024-11-30'),
          },
        ],
      },
    },
  });

  const contract2 = await prisma.contract.create({
    data: {
      id: '550e8400-e29b-41d4-a716-446655440021',
      tenantId: tenant.id,
      customerId: customers[1].id,
      contractNumber: 'CONT-2024-002',
      title: 'Consultoria em Processos Financeiros',
      description: 'Consultoria especializada para otimização de processos financeiros',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-08-31'),
      totalValue: 150000.00,
      currency: 'BRL',
      status: 'ACTIVE',
      performanceObligations: {
        create: [
          {
            id: '550e8400-e29b-41d4-a716-446655440033',
            description: 'Análise e Diagnóstico',
            allocatedAmount: 60000.00,
            recognizedAmount: 60000.00, // Completed
            isDistinct: true,
            satisfactionMethod: 'POINT_IN_TIME',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440034',
            description: 'Implementação de Melhorias',
            allocatedAmount: 90000.00,
            recognizedAmount: 54000.00, // 60% complete
            isDistinct: true,
            satisfactionMethod: 'OVER_TIME',
            estimatedCompletionDate: new Date('2024-07-31'),
          },
        ],
      },
    },
  });

  console.log('✅ Demo contracts created');

  // Create revenue recognition entries
  const revenueEntries = await Promise.all([
    // Contract 1 - Licenses (point in time)
    prisma.revenueRecognition.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440040',
        tenantId: tenant.id,
        contractId: contract1.id,
        performanceObligationId: '550e8400-e29b-41d4-a716-446655440030',
        amount: 200000.00,
        recognitionDate: new Date('2024-01-31'),
        period: '2024-01',
        description: 'Reconhecimento de receita - Licenças de Software',
        status: 'RECOGNIZED',
      },
    }),
    // Contract 1 - Implementation (over time - partial)
    prisma.revenueRecognition.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440041',
        tenantId: tenant.id,
        contractId: contract1.id,
        performanceObligationId: '550e8400-e29b-41d4-a716-446655440031',
        amount: 50000.00,
        recognitionDate: new Date('2024-02-29'),
        period: '2024-02',
        description: 'Reconhecimento de receita - Implementação (20%)',
        status: 'RECOGNIZED',
      },
    }),
    prisma.revenueRecognition.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440042',
        tenantId: tenant.id,
        contractId: contract1.id,
        performanceObligationId: '550e8400-e29b-41d4-a716-446655440031',
        amount: 75000.00,
        recognitionDate: new Date('2024-03-31'),
        period: '2024-03',
        description: 'Reconhecimento de receita - Implementação (30%)',
        status: 'RECOGNIZED',
      },
    }),
    // Contract 2 - Analysis (point in time)
    prisma.revenueRecognition.create({
      data: {
        id: '550e8400-e29b-41d4-a716-446655440043',
        tenantId: tenant.id,
        contractId: contract2.id,
        performanceObligationId: '550e8400-e29b-41d4-a716-446655440033',
        amount: 60000.00,
        recognitionDate: new Date('2024-04-30'),
        period: '2024-04',
        description: 'Reconhecimento de receita - Análise e Diagnóstico',
        status: 'RECOGNIZED',
      },
    }),
  ]);

  console.log('✅ Demo revenue recognition entries created');

  // Reset tenant context
  await prisma.$executeRawUnsafe('RESET app.current_tenant_id;');

  console.log('🎉 Database seed completed successfully!');
  console.log(`
📊 Summary:
- 1 Tenant: ${tenant.name}
- ${users.length} Users
- ${customers.length} Customers  
- 2 Contracts with Performance Obligations
- ${revenueEntries.length} Revenue Recognition Entries

🔐 Demo Login Credentials:
- Admin: admin@demo.com
- Financial Manager: financeiro@demo.com
- Accountant: contabilidade@demo.com

🌐 Tenant ID: ${tenant.id}
  `);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados IFRS 15...');

  // 1. Criar tenant de demonstração
  const tenant = await prisma.tenant.upsert({
    where: { domain: 'demo.ifrs15.com' },
    update: {},
    create: {
      name: 'Empresa Demo IFRS 15',
      domain: 'demo.ifrs15.com',
      isActive: true,
      settings: {
        currency: 'BRL',
        locale: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        fiscalYearStart: '01-01',
        revenueRecognitionMethod: 'ACCRUAL'
      }
    }
  });

  console.log('✅ Tenant criado:', tenant.name);

  // 2. Criar usuários de demonstração
  const adminUser = await prisma.user.upsert({
    where: { 
      email_tenantId: { 
        email: 'admin@demo.ifrs15.com', 
        tenantId: tenant.id 
      } 
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'admin@demo.ifrs15.com',
      name: 'Administrador Sistema',
      roles: ['admin_org', 'gerente_financeiro'],
      isActive: true
    }
  });

  const contadorUser = await prisma.user.upsert({
    where: { 
      email_tenantId: { 
        email: 'contador@demo.ifrs15.com', 
        tenantId: tenant.id 
      } 
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: 'contador@demo.ifrs15.com',
      name: 'João Silva - Contador',
      roles: ['contabilidade'],
      isActive: true
    }
  });

  console.log('✅ Usuários criados:', adminUser.name, contadorUser.name);

  // 3. Criar clientes de demonstração
  const cliente1 = await prisma.customer.upsert({
    where: { id: 'customer-1' },
    update: {},
    create: {
      id: 'customer-1',
      tenantId: tenant.id,
      name: 'TechCorp Ltda',
      email: 'contato@techcorp.com.br',
      taxId: '12.345.678/0001-90',
      address: {
        street: 'Av. Paulista, 1000',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01310-100',
        country: 'Brasil'
      },
      isActive: true
    }
  });

  const cliente2 = await prisma.customer.upsert({
    where: { id: 'customer-2' },
    update: {},
    create: {
      id: 'customer-2',
      tenantId: tenant.id,
      name: 'InnovaSoft S.A.',
      email: 'financeiro@innovasoft.com.br',
      taxId: '98.765.432/0001-10',
      address: {
        street: 'Rua das Flores, 500',
        city: 'Rio de Janeiro',
        state: 'RJ',
        zipCode: '22071-900',
        country: 'Brasil'
      },
      isActive: true
    }
  });

  console.log('✅ Clientes criados:', cliente1.name, cliente2.name);

  // 4. Criar contratos de demonstração
  const contrato1 = await prisma.contract.upsert({
    where: { 
      contractNumber_tenantId: { 
        contractNumber: 'CONT-2024-001', 
        tenantId: tenant.id 
      } 
    },
    update: {},
    create: {
      tenantId: tenant.id,
      customerId: cliente1.id,
      contractNumber: 'CONT-2024-001',
      title: 'Licenciamento de Software ERP + Implementação',
      description: 'Contrato para licenciamento perpétuo de software ERP com serviços de implementação e suporte por 12 meses',
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
      totalValue: 500000.00,
      currency: 'BRL',
      status: 'ACTIVE',
      hasCommercialSubstance: true,
      isEnforceable: true,
      enforcementPeriodStart: new Date('2024-01-01'),
      enforcementPeriodEnd: new Date('2024-12-31')
    }
  });

  const contrato2 = await prisma.contract.upsert({
    where: { 
      contractNumber_tenantId: { 
        contractNumber: 'CONT-2024-002', 
        tenantId: tenant.id 
      } 
    },
    update: {},
    create: {
      tenantId: tenant.id,
      customerId: cliente2.id,
      contractNumber: 'CONT-2024-002',
      title: 'Desenvolvimento de Sistema Customizado',
      description: 'Desenvolvimento de sistema de gestão customizado com entrega em fases',
      startDate: new Date('2024-02-01'),
      endDate: new Date('2025-01-31'),
      totalValue: 800000.00,
      currency: 'BRL',
      status: 'ACTIVE',
      hasCommercialSubstance: true,
      isEnforceable: true,
      enforcementPeriodStart: new Date('2024-02-01'),
      enforcementPeriodEnd: new Date('2025-01-31')
    }
  });

  console.log('✅ Contratos criados:', contrato1.contractNumber, contrato2.contractNumber);

  // 5. Criar obrigações de performance para contrato 1
  const po1_licenca = await prisma.performanceObligation.create({
    data: {
      tenantId: tenant.id,
      contractId: contrato1.id,
      description: 'Licença perpétua de software ERP',
      allocatedAmount: 300000.00,
      recognizedAmount: 300000.00,
      isDistinct: true,
      satisfactionMethod: 'POINT_IN_TIME',
      satisfactionTiming: 'DELIVERY',
      completionPercentage: 100.00
    }
  });

  const po1_implementacao = await prisma.performanceObligation.create({
    data: {
      tenantId: tenant.id,
      contractId: contrato1.id,
      description: 'Serviços de implementação',
      allocatedAmount: 150000.00,
      recognizedAmount: 75000.00,
      isDistinct: true,
      satisfactionMethod: 'OVER_TIME',
      satisfactionTiming: 'CONTINUOUS',
      completionPercentage: 50.00,
      estimatedCompletionDate: new Date('2024-06-30')
    }
  });

  const po1_suporte = await prisma.performanceObligation.create({
    data: {
      tenantId: tenant.id,
      contractId: contrato1.id,
      description: 'Suporte técnico por 12 meses',
      allocatedAmount: 50000.00,
      recognizedAmount: 25000.00,
      isDistinct: true,
      satisfactionMethod: 'OVER_TIME',
      satisfactionTiming: 'CONTINUOUS',
      completionPercentage: 50.00,
      estimatedCompletionDate: new Date('2024-12-31')
    }
  });

  console.log('✅ Obrigações de performance criadas para contrato 1');

  // 6. Criar obrigações de performance para contrato 2
  const po2_fase1 = await prisma.performanceObligation.create({
    data: {
      tenantId: tenant.id,
      contractId: contrato2.id,
      description: 'Fase 1: Análise e Design',
      allocatedAmount: 200000.00,
      recognizedAmount: 200000.00,
      isDistinct: true,
      satisfactionMethod: 'POINT_IN_TIME',
      satisfactionTiming: 'MILESTONE_BASED',
      completionPercentage: 100.00
    }
  });

  const po2_fase2 = await prisma.performanceObligation.create({
    data: {
      tenantId: tenant.id,
      contractId: contrato2.id,
      description: 'Fase 2: Desenvolvimento',
      allocatedAmount: 400000.00,
      recognizedAmount: 160000.00,
      isDistinct: true,
      satisfactionMethod: 'OVER_TIME',
      satisfactionTiming: 'CONTINUOUS',
      completionPercentage: 40.00,
      estimatedCompletionDate: new Date('2024-10-31')
    }
  });

  const po2_fase3 = await prisma.performanceObligation.create({
    data: {
      tenantId: tenant.id,
      contractId: contrato2.id,
      description: 'Fase 3: Testes e Implantação',
      allocatedAmount: 200000.00,
      recognizedAmount: 0.00,
      isDistinct: true,
      satisfactionMethod: 'OVER_TIME',
      satisfactionTiming: 'MILESTONE_BASED',
      completionPercentage: 0.00,
      estimatedCompletionDate: new Date('2025-01-31')
    }
  });

  console.log('✅ Obrigações de performance criadas para contrato 2');

  // 7. Criar schedules de reconhecimento de receita
  const revenueSchedules = [
    // Contrato 1 - Licença (reconhecida imediatamente)
    {
      tenantId: tenant.id,
      contractId: contrato1.id,
      performanceObligationId: po1_licenca.id,
      scheduleType: 'POINT_IN_TIME' as const,
      recognitionMethod: 'POINT_IN_TIME' as const,
      amount: 300000.00,
      recognitionDate: new Date('2024-01-15'),
      period: '2024-01',
      description: 'Reconhecimento da licença perpétua',
      status: 'RECOGNIZED' as const
    },
    // Contrato 1 - Implementação (reconhecida ao longo do tempo)
    {
      tenantId: tenant.id,
      contractId: contrato1.id,
      performanceObligationId: po1_implementacao.id,
      scheduleType: 'OVER_TIME' as const,
      recognitionMethod: 'OVER_TIME_INPUT' as const,
      amount: 25000.00,
      recognitionDate: new Date('2024-01-31'),
      period: '2024-01',
      description: 'Reconhecimento mensal implementação',
      status: 'RECOGNIZED' as const
    },
    {
      tenantId: tenant.id,
      contractId: contrato1.id,
      performanceObligationId: po1_implementacao.id,
      scheduleType: 'OVER_TIME' as const,
      recognitionMethod: 'OVER_TIME_INPUT' as const,
      amount: 25000.00,
      recognitionDate: new Date('2024-02-29'),
      period: '2024-02',
      description: 'Reconhecimento mensal implementação',
      status: 'RECOGNIZED' as const
    },
    {
      tenantId: tenant.id,
      contractId: contrato1.id,
      performanceObligationId: po1_implementacao.id,
      scheduleType: 'OVER_TIME' as const,
      recognitionMethod: 'OVER_TIME_INPUT' as const,
      amount: 25000.00,
      recognitionDate: new Date('2024-03-31'),
      period: '2024-03',
      description: 'Reconhecimento mensal implementação',
      status: 'RECOGNIZED' as const
    }
  ];

  for (const schedule of revenueSchedules) {
    await prisma.revenueSchedule.create({ data: schedule });
  }

  console.log('✅ Schedules de reconhecimento de receita criados');

  // 8. Criar faturas de demonstração
  const fatura1 = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      contractId: contrato1.id,
      invoiceNumber: 'INV-2024-001',
      description: 'Fatura inicial - Licença + 1º mês implementação',
      amount: 325000.00,
      currency: 'BRL',
      issueDate: new Date('2024-01-15'),
      dueDate: new Date('2024-02-14'),
      paidDate: new Date('2024-01-20'),
      status: 'PAID',
      taxAmount: 32500.00,
      totalAmount: 357500.00
    }
  });

  const fatura2 = await prisma.invoice.create({
    data: {
      tenantId: tenant.id,
      contractId: contrato2.id,
      invoiceNumber: 'INV-2024-002',
      description: 'Fatura Fase 1 - Análise e Design',
      amount: 200000.00,
      currency: 'BRL',
      issueDate: new Date('2024-03-01'),
      dueDate: new Date('2024-03-31'),
      paidDate: new Date('2024-03-15'),
      status: 'PAID',
      taxAmount: 20000.00,
      totalAmount: 220000.00
    }
  });

  console.log('✅ Faturas criadas:', fatura1.invoiceNumber, fatura2.invoiceNumber);

  // 9. Criar recibos
  await prisma.receipt.create({
    data: {
      tenantId: tenant.id,
      invoiceId: fatura1.id,
      receiptNumber: 'REC-2024-001',
      amount: 357500.00,
      currency: 'BRL',
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date('2024-01-20'),
      bankReference: 'TED-20240120-001'
    }
  });

  await prisma.receipt.create({
    data: {
      tenantId: tenant.id,
      invoiceId: fatura2.id,
      receiptNumber: 'REC-2024-002',
      amount: 220000.00,
      currency: 'BRL',
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date('2024-03-15'),
      bankReference: 'TED-20240315-001'
    }
  });

  console.log('✅ Recibos criados');

  // 10. Criar custos incrementais
  await prisma.incrementalCost.create({
    data: {
      tenantId: tenant.id,
      contractId: contrato1.id,
      costType: 'SALES_COMMISSION',
      description: 'Comissão de vendas - Contrato TechCorp',
      amount: 25000.00,
      currency: 'BRL',
      incurredDate: new Date('2024-01-15'),
      amortizationPeriod: 12,
      amortizedAmount: 6250.00,
      remainingAmount: 18750.00,
      isRecoverable: true
    }
  });

  await prisma.incrementalCost.create({
    data: {
      tenantId: tenant.id,
      contractId: contrato2.id,
      costType: 'LEGAL_FEES',
      description: 'Honorários advocatícios - Contrato InnovaSoft',
      amount: 15000.00,
      currency: 'BRL',
      incurredDate: new Date('2024-02-01'),
      amortizationPeriod: 12,
      amortizedAmount: 2500.00,
      remainingAmount: 12500.00,
      isRecoverable: true
    }
  });

  console.log('✅ Custos incrementais criados');

  // 11. Criar snapshot de políticas
  await prisma.policySnapshot.create({
    data: {
      tenantId: tenant.id,
      policyType: 'REVENUE_RECOGNITION',
      policyName: 'IFRS 15 Implementation Policy',
      version: '1.0',
      content: {
        description: 'Política de implementação IFRS 15 para reconhecimento de receita',
        principles: [
          'Identificar contratos com clientes',
          'Identificar obrigações de performance',
          'Determinar preço da transação',
          'Alocar preço às obrigações de performance',
          'Reconhecer receita quando obrigação é satisfeita'
        ],
        methods: {
          pointInTime: 'Para licenças perpétuas e entregas únicas',
          overTime: 'Para serviços contínuos e desenvolvimento'
        },
        constraints: {
          variableConsideration: 'Aplicar restrição quando incerteza significativa',
          significantFinancing: 'Ajustar quando período > 12 meses'
        }
      },
      effectiveDate: new Date('2024-01-01'),
      isActive: true,
      createdBy: adminUser.id
    }
  });

  console.log('✅ Snapshot de políticas criado');

  console.log('🎉 Seed concluído com sucesso!');
  console.log('\n📊 Resumo dos dados criados:');
  console.log(`- 1 Tenant: ${tenant.name}`);
  console.log(`- 2 Usuários: Admin e Contador`);
  console.log(`- 2 Clientes: TechCorp e InnovaSoft`);
  console.log(`- 2 Contratos ativos`);
  console.log(`- 6 Obrigações de performance`);
  console.log(`- 3 Schedules de receita reconhecida`);
  console.log(`- 2 Faturas pagas`);
  console.log(`- 2 Recibos`);
  console.log(`- 2 Custos incrementais`);
  console.log(`- 1 Política IFRS 15`);
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

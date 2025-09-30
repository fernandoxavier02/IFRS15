import { ContractRepository } from '@ifrs15/domain';
import { ContractEntity, PerformanceObligationEntity } from '@ifrs15/domain';
import { PaginationQueryDto, ContractQueryDto } from '@ifrs15/shared';
import { PrismaService } from '../database/prisma.service';
import { Contract, PerformanceObligation, Prisma } from '@prisma/client';

export class ContractRepositoryImpl implements ContractRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string, tenantId: string): Promise<ContractEntity | null> {
    const contract = await this.prisma.withTenant(tenantId, async () => {
      return await this.prisma.contract.findUnique({
        where: { id },
        include: {
          performanceObligations: true,
        },
      });
    });

    return contract ? this.mapToEntity(contract) : null;
  }

  async findByContractNumber(contractNumber: string, tenantId: string): Promise<ContractEntity | null> {
    const contract = await this.prisma.withTenant(tenantId, async () => {
      return await this.prisma.contract.findUnique({
        where: {
          contractNumber_tenantId: {
            contractNumber,
            tenantId,
          },
        },
        include: {
          performanceObligations: true,
        },
      });
    });

    return contract ? this.mapToEntity(contract) : null;
  }

  async findMany(query: ContractQueryDto, tenantId: string): Promise<{
    contracts: ContractEntity[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const where: Prisma.ContractWhereInput = {
      tenantId,
    };

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.startDate) {
      where.startDate = {
        gte: query.startDate,
      };
    }

    if (query.endDate) {
      where.endDate = {
        lte: query.endDate,
      };
    }

    const [contracts, total] = await this.prisma.withTenant(tenantId, async () => {
      return await Promise.all([
        this.prisma.contract.findMany({
          where,
          include: {
            performanceObligations: true,
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: {
            [query.sortBy || 'createdAt']: query.sortOrder,
          },
        }),
        this.prisma.contract.count({ where }),
      ]);
    });

    return {
      contracts: contracts.map(this.mapToEntity),
      total,
      page: query.page,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async create(contract: ContractEntity): Promise<ContractEntity> {
    const created = await this.prisma.withTenant(contract.tenantId, async () => {
      return await this.prisma.contract.create({
        data: {
          id: contract.id,
          tenantId: contract.tenantId,
          customerId: contract.customerId,
          contractNumber: contract.contractNumber,
          title: contract.title,
          description: contract.description,
          startDate: contract.startDate,
          endDate: contract.endDate,
          totalValue: contract.totalValue,
          currency: contract.currency,
          status: contract.status,
          performanceObligations: {
            create: contract.performanceObligations.map(po => ({
              id: po.id,
              description: po.description,
              allocatedAmount: po.allocatedAmount,
              recognizedAmount: po.recognizedAmount,
              isDistinct: po.isDistinct,
              satisfactionMethod: po.satisfactionMethod,
              estimatedCompletionDate: po.estimatedCompletionDate,
            })),
          },
        },
        include: {
          performanceObligations: true,
        },
      });
    });

    return this.mapToEntity(created);
  }

  async update(id: string, updates: Partial<ContractEntity>, tenantId: string): Promise<ContractEntity> {
    const updated = await this.prisma.withTenant(tenantId, async () => {
      return await this.prisma.contract.update({
        where: { id },
        data: {
          contractNumber: updates.contractNumber,
          title: updates.title,
          description: updates.description,
          startDate: updates.startDate,
          endDate: updates.endDate,
          totalValue: updates.totalValue,
          currency: updates.currency,
          status: updates.status,
        },
        include: {
          performanceObligations: true,
        },
      });
    });

    return this.mapToEntity(updated);
  }

  async delete(id: string, tenantId: string): Promise<void> {
    await this.prisma.withTenant(tenantId, async () => {
      await this.prisma.contract.delete({
        where: { id },
      });
    });
  }

  async findByCustomerId(customerId: string, tenantId: string): Promise<ContractEntity[]> {
    const contracts = await this.prisma.withTenant(tenantId, async () => {
      return await this.prisma.contract.findMany({
        where: {
          customerId,
          tenantId,
        },
        include: {
          performanceObligations: true,
        },
      });
    });

    return contracts.map(this.mapToEntity);
  }

  async findActiveContracts(tenantId: string): Promise<ContractEntity[]> {
    const contracts = await this.prisma.withTenant(tenantId, async () => {
      return await this.prisma.contract.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
        },
        include: {
          performanceObligations: true,
        },
      });
    });

    return contracts.map(this.mapToEntity);
  }

  async findContractsWithUnrecognizedRevenue(tenantId: string): Promise<ContractEntity[]> {
    const contracts = await this.prisma.withTenant(tenantId, async () => {
      return await this.prisma.contract.findMany({
        where: {
          tenantId,
          status: 'ACTIVE',
          performanceObligations: {
            some: {
              recognizedAmount: {
                lt: this.prisma.performanceObligation.fields.allocatedAmount,
              },
            },
          },
        },
        include: {
          performanceObligations: true,
        },
      });
    });

    return contracts.map(this.mapToEntity);
  }

  private mapToEntity(
    contract: Contract & { performanceObligations: PerformanceObligation[] }
  ): ContractEntity {
    return new ContractEntity(
      contract.id,
      contract.tenantId,
      contract.customerId,
      contract.contractNumber,
      contract.title,
      contract.description || undefined,
      contract.startDate,
      contract.endDate || undefined,
      Number(contract.totalValue),
      contract.currency,
      contract.status,
      contract.performanceObligations.map(po => 
        new PerformanceObligationEntity(
          po.id,
          po.contractId,
          po.description,
          Number(po.allocatedAmount),
          Number(po.recognizedAmount),
          po.isDistinct,
          po.satisfactionMethod,
          po.estimatedCompletionDate || undefined,
          0, // standaloneSellingPrice - not stored in DB, would need separate field
          po.createdAt,
          po.updatedAt
        )
      ),
      contract.createdAt,
      contract.updatedAt
    );
  }
}

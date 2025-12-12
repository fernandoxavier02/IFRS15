import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Contract, Prisma } from '@prisma/client';

@Injectable()
export class ContractsService {
  private readonly logger = new Logger(ContractsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new contract
   */
  async create(
    tenantId: string,
    data: Prisma.ContractCreateInput
  ): Promise<Contract> {
    this.logger.log(`Creating contract for tenant ${tenantId}`);
    
    return this.prisma.contract.create({
      data: {
        ...data,
        tenant: {
          connect: { id: tenantId },
        },
      },
      include: {
        customer: true,
        performanceObligations: true,
      },
    });
  }

  /**
   * Find all contracts for a tenant
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      cursor?: Prisma.ContractWhereUniqueInput;
      where?: Prisma.ContractWhereInput;
      orderBy?: Prisma.ContractOrderByWithRelationInput;
    }
  ): Promise<Contract[]> {
    const { skip, take, cursor, where, orderBy } = params || {};

    return this.prisma.contract.findMany({
      skip,
      take,
      cursor,
      where: {
        ...where,
        tenantId,
      },
      orderBy,
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        performanceObligations: {
          select: {
            id: true,
            description: true,
            status: true,
            allocatedPrice: true,
          },
        },
        transactionPrice: {
          select: {
            totalAmount: true,
            currency: true,
          },
        },
      },
    });
  }

  /**
   * Find a contract by ID
   */
  async findOne(tenantId: string, id: string): Promise<Contract> {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        customer: true,
        performanceObligations: {
          include: {
            promises: true,
            standalonePrices: true,
            revenueSchedules: true,
          },
        },
        transactionPrice: {
          include: {
            variableConsiderations: true,
            significantFinancingComponents: true,
          },
        },
        contractModifications: {
          orderBy: { effectiveDate: 'desc' },
        },
        revenueSchedules: {
          orderBy: { recognitionDate: 'asc' },
        },
      },
    });

    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }

    return contract;
  }

  /**
   * Find contract by contract number
   */
  async findByContractNumber(
    tenantId: string,
    contractNumber: string
  ): Promise<Contract | null> {
    return this.prisma.contract.findFirst({
      where: {
        contractNumber,
        tenantId,
      },
      include: {
        customer: true,
        performanceObligations: true,
      },
    });
  }

  /**
   * Update a contract
   */
  async update(
    tenantId: string,
    id: string,
    data: Prisma.ContractUpdateInput
  ): Promise<Contract> {
    // Verify contract exists and belongs to tenant
    await this.findOne(tenantId, id);

    return this.prisma.contract.update({
      where: { id },
      data,
      include: {
        customer: true,
        performanceObligations: true,
      },
    });
  }

  /**
   * Delete a contract (soft delete)
   */
  async remove(tenantId: string, id: string): Promise<Contract> {
    // Verify contract exists and belongs to tenant
    await this.findOne(tenantId, id);

    return this.prisma.contract.update({
      where: { id },
      data: { 
        status: 'CANCELLED',
      },
    });
  }

  /**
   * Count contracts for a tenant
   */
  async count(tenantId: string, where?: Prisma.ContractWhereInput): Promise<number> {
    return this.prisma.contract.count({
      where: {
        ...where,
        tenantId,
      },
    });
  }

  /**
   * Get contracts by status
   */
  async findByStatus(
    tenantId: string,
    status: string
  ): Promise<Contract[]> {
    return this.prisma.contract.findMany({
      where: {
        tenantId,
        status,
      },
      include: {
        customer: true,
        performanceObligations: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Get contracts by customer
   */
  async findByCustomer(
    tenantId: string,
    customerId: string
  ): Promise<Contract[]> {
    return this.prisma.contract.findMany({
      where: {
        tenantId,
        customerId,
      },
      include: {
        performanceObligations: true,
        revenueSchedules: true,
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Search contracts
   */
  async search(tenantId: string, query: string): Promise<Contract[]> {
    return this.prisma.contract.findMany({
      where: {
        tenantId,
        OR: [
          { contractNumber: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { customer: { name: { contains: query, mode: 'insensitive' } } },
        ],
      },
      include: {
        customer: true,
      },
      take: 20,
      orderBy: { createdAt: 'desc' },
    });
  }
}

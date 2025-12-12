import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';
import { Customer, Prisma } from '@prisma/client';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new customer
   */
  async create(
    tenantId: string,
    data: Prisma.CustomerCreateInput
  ): Promise<Customer> {
    this.logger.log(`Creating customer for tenant ${tenantId}`);
    
    return this.prisma.customer.create({
      data: {
        ...data,
        tenant: {
          connect: { id: tenantId },
        },
      },
    });
  }

  /**
   * Find all customers for a tenant
   */
  async findAll(
    tenantId: string,
    params?: {
      skip?: number;
      take?: number;
      cursor?: Prisma.CustomerWhereUniqueInput;
      where?: Prisma.CustomerWhereInput;
      orderBy?: Prisma.CustomerOrderByWithRelationInput;
    }
  ): Promise<Customer[]> {
    const { skip, take, cursor, where, orderBy } = params || {};

    return this.prisma.customer.findMany({
      skip,
      take,
      cursor,
      where: {
        ...where,
        tenantId,
      },
      orderBy,
      include: {
        contracts: {
          select: {
            id: true,
            contractNumber: true,
            status: true,
            startDate: true,
            endDate: true,
          },
        },
      },
    });
  }

  /**
   * Find a customer by ID
   */
  async findOne(tenantId: string, id: string): Promise<Customer> {
    const customer = await this.prisma.customer.findFirst({
      where: {
        id,
        tenantId,
      },
      include: {
        contracts: true,
      },
    });

    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }

    return customer;
  }

  /**
   * Update a customer
   */
  async update(
    tenantId: string,
    id: string,
    data: Prisma.CustomerUpdateInput
  ): Promise<Customer> {
    // Verify customer exists and belongs to tenant
    await this.findOne(tenantId, id);

    return this.prisma.customer.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete a customer (soft delete by marking inactive)
   */
  async remove(tenantId: string, id: string): Promise<Customer> {
    // Verify customer exists and belongs to tenant
    await this.findOne(tenantId, id);

    return this.prisma.customer.update({
      where: { id },
      data: { isActive: false },
    });
  }

  /**
   * Count customers for a tenant
   */
  async count(tenantId: string, where?: Prisma.CustomerWhereInput): Promise<number> {
    return this.prisma.customer.count({
      where: {
        ...where,
        tenantId,
      },
    });
  }

  /**
   * Search customers by name or email
   */
  async search(tenantId: string, query: string): Promise<Customer[]> {
    return this.prisma.customer.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
          { taxId: { contains: query, mode: 'insensitive' } },
        ],
      },
      take: 20,
      orderBy: { name: 'asc' },
    });
  }
}

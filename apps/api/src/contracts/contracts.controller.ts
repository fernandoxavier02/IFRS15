import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateContractDto } from './dto/create-contract.dto';
import { UpdateContractDto } from './dto/update-contract.dto';

@ApiTags('contracts')
@ApiBearerAuth()
@Controller('contracts')
@UseGuards(JwtAuthGuard, RbacGuard)
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  @Permissions('contracts:create')
  @ApiOperation({ summary: 'Create a new contract' })
  @ApiResponse({ status: 201, description: 'Contract created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Req() req: any, @Body() createContractDto: CreateContractDto) {
    const tenantId = req.user.tenantId;
    return this.contractsService.create(tenantId, createContractDto);
  }

  @Get()
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Get all contracts' })
  @ApiResponse({ status: 200, description: 'Contracts retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Req() req: any,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('status') status?: string,
    @Query('customerId') customerId?: string,
    @Query('search') search?: string
  ) {
    const tenantId = req.user.tenantId;

    // Search query
    if (search) {
      return this.contractsService.search(tenantId, search);
    }

    // Filter by status
    if (status) {
      return this.contractsService.findByStatus(tenantId, status);
    }

    // Filter by customer
    if (customerId) {
      return this.contractsService.findByCustomer(tenantId, customerId);
    }

    // Default: get all with pagination
    const contracts = await this.contractsService.findAll(tenantId, {
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : 50,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.contractsService.count(tenantId);

    return {
      data: contracts,
      meta: {
        total,
        skip: skip || 0,
        take: take || 50,
      },
    };
  }

  @Get(':id')
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Get a contract by ID' })
  @ApiResponse({ status: 200, description: 'Contract retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.contractsService.findOne(tenantId, id);
  }

  @Get('number/:contractNumber')
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Get a contract by contract number' })
  @ApiResponse({ status: 200, description: 'Contract retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async findByNumber(@Req() req: any, @Param('contractNumber') contractNumber: string) {
    const tenantId = req.user.tenantId;
    const contract = await this.contractsService.findByContractNumber(tenantId, contractNumber);
    
    if (!contract) {
      throw new Error(`Contract with number ${contractNumber} not found`);
    }
    
    return contract;
  }

  @Patch(':id')
  @Permissions('contracts:update')
  @ApiOperation({ summary: 'Update a contract' })
  @ApiResponse({ status: 200, description: 'Contract updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateContractDto: UpdateContractDto
  ) {
    const tenantId = req.user.tenantId;
    return this.contractsService.update(tenantId, id, updateContractDto);
  }

  @Delete(':id')
  @Permissions('contracts:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a contract (cancel)' })
  @ApiResponse({ status: 204, description: 'Contract cancelled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    await this.contractsService.remove(tenantId, id);
  }

  @Get(':id/revenue-schedule')
  @Permissions('contracts:read')
  @ApiOperation({ summary: 'Get revenue schedule for a contract' })
  @ApiResponse({ status: 200, description: 'Revenue schedule retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Contract not found' })
  async getRevenueSchedule(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    const contract = await this.contractsService.findOne(tenantId, id);
    
    return {
      contractId: contract.id,
      contractNumber: contract.contractNumber,
      revenueSchedules: contract.revenueSchedules || [],
    };
  }
}

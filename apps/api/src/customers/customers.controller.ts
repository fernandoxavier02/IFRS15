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
import { CustomersService } from './customers.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RbacGuard } from '../auth/guards/rbac.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@ApiTags('customers')
@ApiBearerAuth()
@Controller('customers')
@UseGuards(JwtAuthGuard, RbacGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Post()
  @Permissions('customers:create')
  @ApiOperation({ summary: 'Create a new customer' })
  @ApiResponse({ status: 201, description: 'Customer created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async create(@Req() req: any, @Body() createCustomerDto: CreateCustomerDto) {
    const tenantId = req.user.tenantId;
    return this.customersService.create(tenantId, createCustomerDto);
  }

  @Get()
  @Permissions('customers:read')
  @ApiOperation({ summary: 'Get all customers' })
  @ApiResponse({ status: 200, description: 'Customers retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async findAll(
    @Req() req: any,
    @Query('skip') skip?: number,
    @Query('take') take?: number,
    @Query('search') search?: string
  ) {
    const tenantId = req.user.tenantId;

    if (search) {
      return this.customersService.search(tenantId, search);
    }

    const customers = await this.customersService.findAll(tenantId, {
      skip: skip ? Number(skip) : undefined,
      take: take ? Number(take) : 50,
      orderBy: { createdAt: 'desc' },
    });

    const total = await this.customersService.count(tenantId);

    return {
      data: customers,
      meta: {
        total,
        skip: skip || 0,
        take: take || 50,
      },
    };
  }

  @Get(':id')
  @Permissions('customers:read')
  @ApiOperation({ summary: 'Get a customer by ID' })
  @ApiResponse({ status: 200, description: 'Customer retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async findOne(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.customersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @Permissions('customers:update')
  @ApiOperation({ summary: 'Update a customer' })
  @ApiResponse({ status: 200, description: 'Customer updated successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() updateCustomerDto: UpdateCustomerDto
  ) {
    const tenantId = req.user.tenantId;
    return this.customersService.update(tenantId, id, updateCustomerDto);
  }

  @Delete(':id')
  @Permissions('customers:delete')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a customer (soft delete)' })
  @ApiResponse({ status: 204, description: 'Customer deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Customer not found' })
  async remove(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    await this.customersService.remove(tenantId, id);
  }
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsDateString, IsOptional, IsEnum, IsNumber, IsUUID } from 'class-validator';

export enum ContractStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  SUSPENDED = 'SUSPENDED',
}

export class CreateContractDto {
  @ApiProperty({ description: 'Contract number', example: 'CNT-2025-001' })
  @IsString()
  contractNumber: string;

  @ApiProperty({ description: 'Customer ID', example: 'uuid-of-customer' })
  @IsUUID()
  customerId: string;

  @ApiProperty({ description: 'Contract description', example: 'Software License Agreement', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Contract start date', example: '2025-01-01' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ description: 'Contract end date', example: '2025-12-31', required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ 
    description: 'Contract status', 
    enum: ContractStatus,
    example: ContractStatus.DRAFT,
    default: ContractStatus.DRAFT
  })
  @IsEnum(ContractStatus)
  @IsOptional()
  status?: ContractStatus;

  @ApiProperty({ description: 'Total contract value', example: 120000.00 })
  @IsNumber()
  totalValue: number;

  @ApiProperty({ description: 'Currency code', example: 'BRL', default: 'BRL' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiProperty({ description: 'Payment terms', example: 'Net 30', required: false })
  @IsString()
  @IsOptional()
  paymentTerms?: string;
}

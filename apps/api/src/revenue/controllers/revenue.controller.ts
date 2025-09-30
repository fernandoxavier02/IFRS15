import { 
  Controller, 
  Post, 
  Get, 
  Param, 
  Body, 
  HttpStatus, 
  HttpException,
  UseGuards,
  Logger
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
// import { UserRole } from '@ifrs15/shared';

// Temporary enum until shared package is properly configured
export enum UserRole {
  ADMIN_ORG = 'admin_org',
  GERENTE_FINANCEIRO = 'gerente_financeiro',
  CONTABILIDADE = 'contabilidade',
  AUDITOR_EXTERNO = 'auditor_externo',
  CLIENTE = 'cliente'
}

import { TransactionPriceService, TransactionPriceCalculationInput } from '../services/transaction-price.service';
import { PriceAllocationService, PriceAllocationInput } from '../services/price-allocation.service';
import { RevenueScheduleService, PerformanceObligationScheduleInput } from '../services/revenue-schedule.service';
import { ContractModificationService, ContractModificationInput } from '../services/contract-modification.service';

@ApiTags('Revenue Recognition')
@Controller('contratos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RevenueController {
  private readonly logger = new Logger(RevenueController.name);

  constructor(
    private readonly transactionPriceService: TransactionPriceService,
    private readonly priceAllocationService: PriceAllocationService,
    private readonly revenueScheduleService: RevenueScheduleService,
    private readonly contractModificationService: ContractModificationService
  ) {}

  @Post(':id/avaliar')
  @Roles(UserRole.GERENTE_FINANCEIRO, UserRole.CONTABILIDADE, UserRole.ADMIN_ORG)
  @ApiOperation({ 
    summary: 'Avalia contrato e calcula alocação de preços',
    description: 'Calcula preço de transação ajustado, aloca por performance obligations e gera agenda de receita'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Avaliação do contrato realizada com sucesso',
    schema: {
      type: 'object',
      properties: {
        contractId: { type: 'string' },
        transactionPrice: {
          type: 'object',
          properties: {
            adjustedTransactionPrice: { type: 'number' },
            adjustments: { type: 'object' },
            constraintAnalysis: { type: 'object' },
            breakdown: { type: 'object' }
          }
        },
        priceAllocation: {
          type: 'object',
          properties: {
            totalTransactionPrice: { type: 'number' },
            totalStandaloneSellingPrice: { type: 'number' },
            totalDiscount: { type: 'number' },
            allocations: { type: 'array' },
            validation: { type: 'object' }
          }
        },
        revenueSchedules: { type: 'array' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  async evaluateContract(
    @Param('id') contractId: string,
    @Body() evaluationRequest: ContractEvaluationRequest
  ) {
    try {
      this.logger.log(`Evaluating contract ${contractId}`);

      // Step 1: Calculate adjusted transaction price
      const transactionPriceResult = await this.transactionPriceService.calculateAdjustedTransactionPrice(
        evaluationRequest.transactionPriceInput
      );

      // Step 2: Allocate transaction price across performance obligations
      const allocationInput: PriceAllocationInput = {
        contractId,
        adjustedTransactionPrice: transactionPriceResult.adjustedTransactionPrice,
        performanceObligations: evaluationRequest.performanceObligations,
        allocationMethod: evaluationRequest.allocationMethod,
        discountAllocation: evaluationRequest.discountAllocation,
        specificDiscountPO: evaluationRequest.specificDiscountPO
      };

      const allocationResult = await this.priceAllocationService.allocateTransactionPrice(allocationInput);

      // Step 3: Generate revenue schedules for each performance obligation
      const revenueSchedules = [];
      
      for (const allocation of allocationResult.allocations) {
        const scheduleInput = evaluationRequest.revenueScheduleInputs.find(
          input => input.performanceObligationId === allocation.performanceObligationId
        );

        if (scheduleInput) {
          const scheduleInputWithAllocation: PerformanceObligationScheduleInput = {
            ...scheduleInput,
            allocatedAmount: allocation.allocatedAmount
          };

          const schedule = await this.revenueScheduleService.generateRevenueSchedule(scheduleInputWithAllocation);
          revenueSchedules.push(schedule);
        }
      }

      return {
        contractId,
        evaluationDate: new Date(),
        transactionPrice: transactionPriceResult,
        priceAllocation: allocationResult,
        revenueSchedules,
        summary: {
          totalContractValue: transactionPriceResult.adjustedTransactionPrice,
          totalAllocated: allocationResult.validation.totalAllocated,
          performanceObligationsCount: allocationResult.allocations.length,
          allocationValid: allocationResult.validation.isValid
        }
      };

    } catch (error) {
      this.logger.error(`Error evaluating contract ${contractId}:`, error);
      throw new HttpException(
        `Failed to evaluate contract: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/agenda')
  @Roles(UserRole.GERENTE_FINANCEIRO, UserRole.CONTABILIDADE, UserRole.AUDITOR_EXTERNO, UserRole.ADMIN_ORG)
  @ApiOperation({ 
    summary: 'Obtém agenda de receita do contrato',
    description: 'Retorna a agenda de reconhecimento de receita detalhada por performance obligation'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Agenda de receita obtida com sucesso',
    schema: {
      type: 'object',
      properties: {
        contractId: { type: 'string' },
        totalContractValue: { type: 'number' },
        totalRecognized: { type: 'number' },
        totalRemaining: { type: 'number' },
        performanceObligations: { type: 'array' },
        consolidatedSchedule: { type: 'array' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  async getRevenueSchedule(@Param('id') contractId: string) {
    try {
      this.logger.log(`Getting revenue schedule for contract ${contractId}`);

      // In a real implementation, this would fetch from database
      // For now, return a structured response indicating the endpoint is ready
      
      return {
        contractId,
        message: 'Revenue schedule endpoint is ready. Implementation requires database integration.',
        structure: {
          totalContractValue: 0,
          totalRecognized: 0,
          totalRemaining: 0,
          performanceObligations: [],
          consolidatedSchedule: [],
          lastUpdated: new Date()
        }
      };

    } catch (error) {
      this.logger.error(`Error getting revenue schedule for contract ${contractId}:`, error);
      throw new HttpException(
        `Failed to get revenue schedule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/modificar')
  @Roles(UserRole.GERENTE_FINANCEIRO, UserRole.CONTABILIDADE, UserRole.ADMIN_ORG)
  @ApiOperation({ 
    summary: 'Processa modificação de contrato',
    description: 'Analisa e processa modificações contratuais com reprocessamento da agenda de receita'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Modificação processada com sucesso',
    schema: {
      type: 'object',
      properties: {
        modificationId: { type: 'string' },
        treatment: { type: 'string' },
        modificationType: { type: 'string' },
        financialImpact: { type: 'object' },
        revenueScheduleAdjustments: { type: 'array' },
        accountingEntries: { type: 'array' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dados de modificação inválidos' })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  async modifyContract(
    @Param('id') contractId: string,
    @Body() modificationRequest: ContractModificationInput
  ) {
    try {
      this.logger.log(`Processing contract modification for contract ${contractId}`);

      // Validate input
      const validationErrors = this.contractModificationService.validateModificationInput({
        ...modificationRequest,
        originalContractId: contractId
      });

      if (validationErrors.length > 0) {
        throw new HttpException(
          { message: 'Invalid modification data', errors: validationErrors },
          HttpStatus.BAD_REQUEST
        );
      }

      // Process modification
      const modificationResult = await this.contractModificationService.processModification({
        ...modificationRequest,
        originalContractId: contractId
      });

      return {
        success: true,
        modificationResult,
        processedAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Error processing contract modification for ${contractId}:`, error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        `Failed to process contract modification: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/reprocessar')
  @Roles(UserRole.GERENTE_FINANCEIRO, UserRole.CONTABILIDADE, UserRole.ADMIN_ORG)
  @ApiOperation({ 
    summary: 'Reprocessa agenda de receita',
    description: 'Reprocessa a agenda de receita com base em atualizações de progresso ou estimativas'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Reprocessamento realizado com sucesso'
  })
  @ApiResponse({ status: 404, description: 'Contrato não encontrado' })
  async reprocessRevenueSchedule(
    @Param('id') contractId: string,
    @Body() reprocessRequest: ReprocessRequest
  ) {
    try {
      this.logger.log(`Reprocessing revenue schedule for contract ${contractId}`);

      const results = [];

      for (const update of reprocessRequest.progressUpdates) {
        const scheduleInput: PerformanceObligationScheduleInput = {
          performanceObligationId: update.performanceObligationId,
          allocatedAmount: update.allocatedAmount,
          recognitionMethod: update.recognitionMethod,
          progressMeasurement: update.progressMeasurement,
          contractStartDate: update.contractStartDate,
          contractEndDate: update.contractEndDate,
          totalEstimatedCosts: update.totalEstimatedCosts,
          totalEstimatedUnits: update.totalEstimatedUnits,
          totalEstimatedValue: update.totalEstimatedValue,
          periodicUpdates: update.periodicUpdates
        };

        const reprocessedSchedule = await this.revenueScheduleService.generateRevenueSchedule(scheduleInput);
        results.push(reprocessedSchedule);
      }

      return {
        contractId,
        reprocessedAt: new Date(),
        reprocessedSchedules: results,
        summary: {
          performanceObligationsUpdated: results.length,
          totalReestimateAdjustments: results.reduce((sum, r) => sum + r.reestimateHistory.length, 0)
        }
      };

    } catch (error) {
      this.logger.error(`Error reprocessing revenue schedule for contract ${contractId}:`, error);
      throw new HttpException(
        `Failed to reprocess revenue schedule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

// DTOs for request validation
export interface ContractEvaluationRequest {
  transactionPriceInput: TransactionPriceCalculationInput;
  performanceObligations: Array<{
    id: string;
    description: string;
    standaloneSellingPrice?: number;
    isDistinct: boolean;
    estimatedCost?: number;
    marginPercentage?: number;
  }>;
  allocationMethod?: 'STANDALONE_PRICE' | 'RESIDUAL' | 'COST_PLUS_MARGIN' | 'AUTO';
  discountAllocation?: 'PROPORTIONAL' | 'SPECIFIC_PO' | 'NONE';
  specificDiscountPO?: string;
  revenueScheduleInputs: Array<Omit<PerformanceObligationScheduleInput, 'allocatedAmount'>>;
}

export interface ReprocessRequest {
  reason: string;
  progressUpdates: Array<PerformanceObligationScheduleInput>;
}

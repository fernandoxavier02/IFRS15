import { 
  Controller, 
  Post, 
  Get, 
  Body, 
  Param, 
  UseGuards, 
  HttpStatus, 
  HttpCode
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBearerAuth, 
  ApiParam 
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RBACGuard } from '../../auth/guards/rbac.guard';
import { RBAC, RequireTenantAccess } from '../../auth/decorators/permissions.decorator';

// Temporary enum until shared package is properly configured
export enum UserRole {
  ADMIN_ORG = 'admin_org',
  GERENTE_FINANCEIRO = 'gerente_financeiro',
  CONTABILIDADE = 'contabilidade',
  AUDITOR_EXTERNO = 'auditor_externo',
  CLIENTE = 'cliente'
}

import { 
  DACService, 
  DACRegistrationInput, 
  DACAmortizationScheduleInput, 
  DACImpairmentTestInput 
} from '../services/dac.service';

@ApiTags('Deferred Acquisition Costs (DAC)')
@Controller('dac')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class DACController {
  private readonly logger = new Logger(DACController.name);

  constructor(private readonly dacService: DACService) {}

  @Post()
  @Roles(UserRole.GERENTE_FINANCEIRO, UserRole.CONTABILIDADE, UserRole.ADMIN_ORG)
  @ApiOperation({ 
    summary: 'Registra custos incrementais de obtenção (DAC)',
    description: 'Registra custos elegíveis de aquisição de contratos e calcula cronograma de amortização'
  })
  @ApiResponse({ 
    status: 201, 
    description: 'DAC registrado com sucesso',
    schema: {
      type: 'object',
      properties: {
        dacId: { type: 'string' },
        registrationDate: { type: 'string', format: 'date-time' },
        initialAmount: { type: 'number' },
        amortizationSchedule: { type: 'array' },
        accountingEntries: { type: 'array' },
        validation: { type: 'object' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dados de entrada inválidos' })
  @ApiResponse({ status: 403, description: 'Acesso negado' })
  async registerDAC(@Body() registrationRequest: DACRegistrationInput) {
    try {
      this.logger.log(`Registering DAC for contract ${registrationRequest.contractId}`);

      const result = await this.dacService.registerDAC(registrationRequest);

      return {
        success: true,
        data: result,
        message: 'DAC registered successfully',
        registeredAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Error registering DAC for contract ${registrationRequest.contractId}:`, error);
      throw new HttpException(
        `Failed to register DAC: ${error.message}`,
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Get(':id/agenda')
  @Roles(UserRole.GERENTE_FINANCEIRO, UserRole.CONTABILIDADE, UserRole.AUDITOR_EXTERNO, UserRole.ADMIN_ORG)
  @ApiOperation({ 
    summary: 'Obtém cronograma de amortização do DAC',
    description: 'Retorna o cronograma detalhado de amortização dos custos diferidos'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Cronograma de amortização obtido com sucesso',
    schema: {
      type: 'object',
      properties: {
        dacId: { type: 'string' },
        totalOriginalAmount: { type: 'number' },
        totalAmortized: { type: 'number' },
        remainingBalance: { type: 'number' },
        amortizationSchedule: { type: 'array' },
        nextAmortizationDate: { type: 'string', format: 'date' },
        accountingEntries: { type: 'array' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'DAC não encontrado' })
  async getDACAmortizationSchedule(@Param('id') dacId: string) {
    try {
      this.logger.log(`Getting DAC amortization schedule for ${dacId}`);

      // For demonstration, create a sample schedule input
      const scheduleInput: DACAmortizationScheduleInput = {
        dacId,
        contractStartDate: new Date('2024-01-01'),
        contractEndDate: new Date('2026-12-31')
      };

      const result = await this.dacService.generateAmortizationSchedule(scheduleInput);

      return {
        success: true,
        data: result,
        retrievedAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Error getting DAC amortization schedule for ${dacId}:`, error);
      throw new HttpException(
        `Failed to get DAC amortization schedule: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/teste-impairment')
  @Roles(UserRole.GERENTE_FINANCEIRO, UserRole.CONTABILIDADE, UserRole.ADMIN_ORG)
  @ApiOperation({ 
    summary: 'Executa teste de recuperabilidade do DAC',
    description: 'Compara valor contábil do DAC com consideração remanescente líquida para identificar impairment'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Teste de impairment executado com sucesso',
    schema: {
      type: 'object',
      properties: {
        dacId: { type: 'string' },
        testDate: { type: 'string', format: 'date' },
        carryingAmount: { type: 'number' },
        recoverableAmount: { type: 'number' },
        impairmentLoss: { type: 'number' },
        isImpaired: { type: 'boolean' },
        impairmentCalculation: { type: 'object' },
        accountingEntries: { type: 'array' },
        recommendations: { type: 'array' }
      }
    }
  })
  @ApiResponse({ status: 400, description: 'Dados de teste inválidos' })
  @ApiResponse({ status: 404, description: 'DAC não encontrado' })
  async performImpairmentTest(
    @Param('id') dacId: string,
    @Body() impairmentRequest: Omit<DACImpairmentTestInput, 'dacId'>
  ) {
    try {
      this.logger.log(`Performing impairment test for DAC ${dacId}`);

      const impairmentInput: DACImpairmentTestInput = {
        dacId,
        ...impairmentRequest
      };

      const result = await this.dacService.performImpairmentTest(impairmentInput);

      return {
        success: true,
        data: result,
        testedAt: new Date(),
        summary: {
          impairmentRequired: result.isImpaired,
          impairmentAmount: result.impairmentLoss,
          recoverabilityRatio: result.recoverableAmount / result.carryingAmount
        }
      };

    } catch (error) {
      this.logger.error(`Error performing impairment test for DAC ${dacId}:`, error);
      throw new HttpException(
        `Failed to perform impairment test: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id/status')
  @Roles(UserRole.GERENTE_FINANCEIRO, UserRole.CONTABILIDADE, UserRole.AUDITOR_EXTERNO, UserRole.ADMIN_ORG)
  @ApiOperation({ 
    summary: 'Obtém status atual do DAC',
    description: 'Retorna informações consolidadas sobre o status atual dos custos diferidos'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Status do DAC obtido com sucesso'
  })
  @ApiResponse({ status: 404, description: 'DAC não encontrado' })
  async getDACStatus(@Param('id') dacId: string) {
    try {
      this.logger.log(`Getting DAC status for ${dacId}`);

      // In a real implementation, this would fetch from database
      // For now, return a structured response indicating the endpoint is ready
      
      return {
        dacId,
        status: 'active',
        currentBalance: 75000,
        originalAmount: 100000,
        amortizedToDate: 25000,
        amortizationProgress: 25,
        nextAmortizationDate: new Date('2024-02-01'),
        lastImpairmentTest: new Date('2024-01-01'),
        impairmentStatus: 'no_impairment_required',
        message: 'DAC status endpoint is ready. Implementation requires database integration.',
        retrievedAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Error getting DAC status for ${dacId}:`, error);
      throw new HttpException(
        `Failed to get DAC status: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/reestimate')
  @Roles(UserRole.GERENTE_FINANCEIRO, UserRole.CONTABILIDADE, UserRole.ADMIN_ORG)
  @ApiOperation({ 
    summary: 'Reestima cronograma de amortização do DAC',
    description: 'Ajusta cronograma de amortização baseado em mudanças no padrão de transferência ou modificações contratuais'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Reestimativa realizada com sucesso'
  })
  @ApiResponse({ status: 400, description: 'Dados de reestimativa inválidos' })
  @ApiResponse({ status: 404, description: 'DAC não encontrado' })
  async reestimateDACAmortization(
    @Param('id') dacId: string,
    @Body() reestimateRequest: {
      reason: string;
      newAmortizationPattern?: Array<{
        period: Date;
        transferPercentage: number;
      }>;
      contractModification?: {
        newEndDate: Date;
        additionalConsideration: number;
      };
      effectiveDate: Date;
    }
  ) {
    try {
      this.logger.log(`Reestimating DAC amortization for ${dacId}`);

      // In a real implementation, this would:
      // 1. Validate the reestimate request
      // 2. Calculate new amortization schedule
      // 3. Generate catch-up adjustments if needed
      // 4. Create accounting entries for adjustments

      return {
        dacId,
        reestimateDate: new Date(),
        reason: reestimateRequest.reason,
        adjustments: {
          cumulativeCatchUp: 5000,
          futureAmortizationAdjustment: -2000,
          newAmortizationSchedule: []
        },
        accountingEntries: [
          {
            account: '6200',
            debit: 5000,
            description: 'DAC amortization catch-up adjustment'
          },
          {
            account: '1350',
            credit: 5000,
            description: 'DAC amortization catch-up adjustment'
          }
        ],
        message: 'DAC reestimation endpoint is ready. Implementation requires database integration.',
        processedAt: new Date()
      };

    } catch (error) {
      this.logger.error(`Error reestimating DAC amortization for ${dacId}:`, error);
      throw new HttpException(
        `Failed to reestimate DAC amortization: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

// DTOs for request validation
export interface DACRegistrationRequest extends DACRegistrationInput {}

export interface DACImpairmentTestRequest {
  testDate: Date;
  remainingConsideration: number;
  directCosts: number;
  estimatedCostsToComplete: number;
  contractModifications?: {
    additionalConsideration: number;
    additionalCosts: number;
  };
}

export interface DACReestimateRequest {
  reason: string;
  newAmortizationPattern?: Array<{
    period: Date;
    transferPercentage: number;
  }>;
  contractModification?: {
    newEndDate: Date;
    additionalConsideration: number;
  };
  effectiveDate: Date;
}

import { Injectable, Logger } from '@nestjs/common';

// Local type definitions for DAC module
export type DACCostType = 
  | 'SALES_COMMISSION'
  | 'BROKER_FEE'
  | 'LEGAL_FEES'
  | 'DUE_DILIGENCE'
  | 'OTHER_INCREMENTAL';

export type AmortizationMethod = 
  | 'STRAIGHT_LINE'
  | 'PERFORMANCE_OBLIGATION_PATTERN'
  | 'CONTRACT_PATTERN'
  | 'REVENUE_PATTERN';

export interface DACRegistrationInput {
  contractId: string;
  performanceObligationId?: string;
  costType: DACCostType;
  amount: number;
  description: string;
  incurredDate: Date;
  isIncremental: boolean;
  isRecoverable: boolean;
  amortizationMethod: AmortizationMethod;
  amortizationPeriodMonths: number;
  expectedBenefitPeriod: Date;
  supportingDocuments?: string[];
}

export interface DACAmortizationScheduleInput {
  dacId: string;
  contractStartDate: Date;
  contractEndDate: Date;
  performanceObligationPattern?: Array<{
    period: Date;
    transferPercentage: number;
  }>;
  revenuePattern?: Array<{
    period: Date;
    revenueAmount: number;
  }>;
}

export interface DACImpairmentTestInput {
  dacId: string;
  testDate: Date;
  remainingConsideration: number;
  directCosts: number;
  estimatedCostsToComplete: number;
  contractModifications?: {
    additionalConsideration: number;
    additionalCosts: number;
  };
}

export interface DACRegistrationResult {
  dacId: string;
  registrationDate: Date;
  initialAmount: number;
  amortizationSchedule: Array<{
    period: Date;
    amortizationAmount: number;
    remainingBalance: number;
  }>;
  accountingEntries: Array<{
    account: string;
    debit?: number;
    credit?: number;
    description: string;
  }>;
  validation: {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  };
}

export interface DACAmortizationResult {
  dacId: string;
  totalOriginalAmount: number;
  totalAmortized: number;
  remainingBalance: number;
  amortizationSchedule: Array<{
    period: Date;
    beginningBalance: number;
    amortizationAmount: number;
    endingBalance: number;
    cumulativeAmortization: number;
  }>;
  nextAmortizationDate: Date;
  accountingEntries: Array<{
    period: Date;
    entries: Array<{
      account: string;
      debit?: number;
      credit?: number;
      description: string;
    }>;
  }>;
}

export interface DACImpairmentResult {
  dacId: string;
  testDate: Date;
  carryingAmount: number;
  recoverableAmount: number;
  impairmentLoss: number;
  isImpaired: boolean;
  impairmentCalculation: {
    remainingConsideration: number;
    directCosts: number;
    estimatedCostsToComplete: number;
    netRecoverableAmount: number;
  };
  accountingEntries: Array<{
    account: string;
    debit?: number;
    credit?: number;
    description: string;
  }>;
  recommendations: string[];
}

@Injectable()
export class DACService {
  private readonly logger = new Logger(DACService.name);

  /**
   * Registers deferred acquisition costs for a contract
   */
  async registerDAC(input: DACRegistrationInput): Promise<DACRegistrationResult> {
    this.logger.log(`Registering DAC for contract ${input.contractId}`);

    // Validate input
    const validation = this.validateDACRegistration(input);
    if (!validation.isValid) {
      throw new Error(`Invalid DAC registration: ${validation.errors.join(', ')}`);
    }

    // Generate unique DAC ID
    const dacId = `DAC-${input.contractId}-${Date.now()}`;

    // Calculate amortization schedule
    const amortizationSchedule = this.calculateAmortizationSchedule({
      dacId,
      contractStartDate: new Date(),
      contractEndDate: input.expectedBenefitPeriod,
      amortizationMethod: input.amortizationMethod,
      totalAmount: input.amount,
      periodMonths: input.amortizationPeriodMonths
    });

    // Generate accounting entries for initial recognition
    const accountingEntries = this.generateInitialAccountingEntries(input);

    return {
      dacId,
      registrationDate: new Date(),
      initialAmount: input.amount,
      amortizationSchedule,
      accountingEntries,
      validation
    };
  }

  /**
   * Generates amortization schedule for DAC
   */
  async generateAmortizationSchedule(input: DACAmortizationScheduleInput): Promise<DACAmortizationResult> {
    this.logger.log(`Generating amortization schedule for DAC ${input.dacId}`);

    // In a real implementation, this would fetch DAC details from database
    const dacAmount = 100000; // Mock amount
    const amortizationMethod = 'STRAIGHT_LINE'; // Mock method

    const schedule = this.calculateAmortizationSchedule({
      dacId: input.dacId,
      contractStartDate: input.contractStartDate,
      contractEndDate: input.contractEndDate,
      amortizationMethod,
      totalAmount: dacAmount,
      periodMonths: this.calculatePeriodMonths(input.contractStartDate, input.contractEndDate)
    });

    // Generate accounting entries for each period
    const accountingEntries = this.generateAmortizationAccountingEntries(schedule);

    const totalAmortized = schedule.reduce((sum, item) => sum + item.amortizationAmount, 0);

    return {
      dacId: input.dacId,
      totalOriginalAmount: dacAmount,
      totalAmortized,
      remainingBalance: dacAmount - totalAmortized,
      amortizationSchedule: schedule.map((item, index) => ({
        period: item.period,
        beginningBalance: index === 0 ? dacAmount : schedule[index - 1].remainingBalance,
        amortizationAmount: item.amortizationAmount,
        endingBalance: item.remainingBalance,
        cumulativeAmortization: schedule.slice(0, index + 1).reduce((sum, s) => sum + s.amortizationAmount, 0)
      })),
      nextAmortizationDate: this.getNextAmortizationDate(schedule),
      accountingEntries
    };
  }

  /**
   * Performs impairment test for DAC
   */
  async performImpairmentTest(input: DACImpairmentTestInput): Promise<DACImpairmentResult> {
    this.logger.log(`Performing impairment test for DAC ${input.dacId}`);

    // In a real implementation, this would fetch current DAC balance from database
    const carryingAmount = 75000; // Mock carrying amount

    // Calculate recoverable amount
    const recoverableAmount = this.calculateRecoverableAmount(input);
    
    // Determine impairment
    const impairmentLoss = Math.max(0, carryingAmount - recoverableAmount);
    const isImpaired = impairmentLoss > 0;

    // Generate accounting entries if impaired
    const accountingEntries = isImpaired 
      ? this.generateImpairmentAccountingEntries(impairmentLoss)
      : [];

    // Generate recommendations
    const recommendations = this.generateImpairmentRecommendations(
      carryingAmount,
      recoverableAmount,
      isImpaired
    );

    return {
      dacId: input.dacId,
      testDate: input.testDate,
      carryingAmount,
      recoverableAmount,
      impairmentLoss,
      isImpaired,
      impairmentCalculation: {
        remainingConsideration: input.remainingConsideration,
        directCosts: input.directCosts,
        estimatedCostsToComplete: input.estimatedCostsToComplete,
        netRecoverableAmount: recoverableAmount
      },
      accountingEntries,
      recommendations
    };
  }

  /**
   * Validates DAC registration input
   */
  private validateDACRegistration(input: DACRegistrationInput): { isValid: boolean; warnings: string[]; errors: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required field validation
    if (!input.contractId) errors.push('Contract ID is required');
    if (!input.amount || input.amount <= 0) errors.push('Amount must be greater than zero');
    if (!input.description) errors.push('Description is required');
    if (!input.incurredDate) errors.push('Incurred date is required');
    if (!input.expectedBenefitPeriod) errors.push('Expected benefit period is required');

    // Business rule validation
    if (!input.isIncremental) {
      warnings.push('Cost is not incremental - may not qualify for DAC treatment');
    }

    if (input.amount > 1000000) {
      warnings.push('Large DAC amount - ensure proper approval and documentation');
    }

    if (input.amortizationPeriodMonths > 120) {
      warnings.push('Long amortization period - review for reasonableness');
    }

    // Date validation
    if (input.expectedBenefitPeriod <= input.incurredDate) {
      errors.push('Expected benefit period must be after incurred date');
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Calculates amortization schedule based on method
   */
  private calculateAmortizationSchedule(params: {
    dacId: string;
    contractStartDate: Date;
    contractEndDate: Date;
    amortizationMethod: string;
    totalAmount: number;
    periodMonths: number;
  }): Array<{ period: Date; amortizationAmount: number; remainingBalance: number }> {
    const schedule: Array<{ period: Date; amortizationAmount: number; remainingBalance: number }> = [];
    const monthlyAmount = params.totalAmount / params.periodMonths;
    let remainingBalance = params.totalAmount;

    for (let month = 0; month < params.periodMonths; month++) {
      const period = new Date(params.contractStartDate);
      period.setMonth(period.getMonth() + month + 1);

      const amortizationAmount = Math.min(monthlyAmount, remainingBalance);
      remainingBalance -= amortizationAmount;

      schedule.push({
        period,
        amortizationAmount,
        remainingBalance
      });

      if (remainingBalance <= 0) break;
    }

    return schedule;
  }

  /**
   * Generates initial accounting entries for DAC recognition
   */
  private generateInitialAccountingEntries(input: DACRegistrationInput): Array<{
    account: string;
    debit?: number;
    credit?: number;
    description: string;
  }> {
    return [
      {
        account: '1350', // Deferred Acquisition Costs
        debit: input.amount,
        description: `Initial recognition of DAC - ${input.description}`
      },
      {
        account: '2100', // Accounts Payable or Cash
        credit: input.amount,
        description: `Payment/accrual of acquisition costs - ${input.description}`
      }
    ];
  }

  /**
   * Generates accounting entries for amortization
   */
  private generateAmortizationAccountingEntries(
    schedule: Array<{ period: Date; amortizationAmount: number; remainingBalance: number }>
  ): Array<{
    period: Date;
    entries: Array<{
      account: string;
      debit?: number;
      credit?: number;
      description: string;
    }>;
  }> {
    return schedule.map(item => ({
      period: item.period,
      entries: [
        {
          account: '6200', // DAC Amortization Expense
          debit: item.amortizationAmount,
          description: `DAC amortization expense for period ${item.period.toISOString().slice(0, 7)}`
        },
        {
          account: '1350', // Deferred Acquisition Costs
          credit: item.amortizationAmount,
          description: `DAC amortization for period ${item.period.toISOString().slice(0, 7)}`
        }
      ]
    }));
  }

  /**
   * Generates accounting entries for impairment
   */
  private generateImpairmentAccountingEntries(impairmentLoss: number): Array<{
    account: string;
    debit?: number;
    credit?: number;
    description: string;
  }> {
    return [
      {
        account: '6300', // DAC Impairment Loss
        debit: impairmentLoss,
        description: 'DAC impairment loss recognition'
      },
      {
        account: '1350', // Deferred Acquisition Costs
        credit: impairmentLoss,
        description: 'DAC impairment write-down'
      }
    ];
  }

  /**
   * Calculates recoverable amount for impairment test
   */
  private calculateRecoverableAmount(input: DACImpairmentTestInput): number {
    let recoverableAmount = input.remainingConsideration - input.directCosts - input.estimatedCostsToComplete;

    // Include contract modifications if any
    if (input.contractModifications) {
      recoverableAmount += input.contractModifications.additionalConsideration;
      recoverableAmount -= input.contractModifications.additionalCosts;
    }

    return Math.max(0, recoverableAmount);
  }

  /**
   * Generates impairment test recommendations
   */
  private generateImpairmentRecommendations(
    carryingAmount: number,
    recoverableAmount: number,
    isImpaired: boolean
  ): string[] {
    const recommendations: string[] = [];

    if (isImpaired) {
      recommendations.push('Immediate impairment loss recognition required');
      recommendations.push('Review contract terms and performance to understand impairment drivers');
      recommendations.push('Consider impact on future DAC recognition policies');
    } else {
      const margin = recoverableAmount - carryingAmount;
      const marginPercentage = (margin / carryingAmount) * 100;

      if (marginPercentage < 10) {
        recommendations.push('Low recovery margin - monitor closely for future impairment');
      }
      
      if (marginPercentage > 50) {
        recommendations.push('Strong recovery position - DAC appears well supported');
      }
    }

    recommendations.push('Document impairment test assumptions and calculations');
    recommendations.push('Schedule next impairment test based on contract performance');

    return recommendations;
  }

  /**
   * Calculates period in months between two dates
   */
  private calculatePeriodMonths(startDate: Date, endDate: Date): number {
    const yearDiff = endDate.getFullYear() - startDate.getFullYear();
    const monthDiff = endDate.getMonth() - startDate.getMonth();
    return yearDiff * 12 + monthDiff;
  }

  /**
   * Gets next amortization date from schedule
   */
  private getNextAmortizationDate(
    schedule: Array<{ period: Date; amortizationAmount: number; remainingBalance: number }>
  ): Date {
    const today = new Date();
    const futureSchedule = schedule.filter(item => item.period > today && item.remainingBalance > 0);
    return futureSchedule.length > 0 ? futureSchedule[0].period : schedule[schedule.length - 1].period;
  }
}

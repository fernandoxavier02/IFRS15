import { Injectable, Logger } from '@nestjs/common';

export type RecognitionMethod = 'POINT_IN_TIME' | 'OVER_TIME';
export type ProgressMeasurement = 'COST_TO_COST' | 'UNITS_OF_DELIVERY' | 'VALUE_OF_DELIVERY' | 'TIME_ELAPSED';

export interface PerformanceObligationScheduleInput {
  performanceObligationId: string;
  allocatedAmount: number;
  recognitionMethod: RecognitionMethod;
  progressMeasurement?: ProgressMeasurement;
  
  // Point-in-time specific
  controlTransferDate?: Date;
  
  // Over-time specific
  contractStartDate?: Date;
  contractEndDate?: Date;
  totalEstimatedCosts?: number;
  totalEstimatedUnits?: number;
  totalEstimatedValue?: number;
  
  // Progress tracking
  periodicUpdates?: PeriodicProgressUpdate[];
}

export interface PeriodicProgressUpdate {
  periodEndDate: Date;
  actualCostsIncurred: number;
  actualUnitsDelivered: number;
  actualValueDelivered: number;
  revisedTotalEstimatedCosts?: number;
  revisedTotalEstimatedUnits?: number;
  revisedTotalEstimatedValue?: number;
}

export interface RevenueScheduleEntry {
  periodEndDate: Date;
  periodStartDate: Date;
  progressPercentage: number;
  revenueAmount: number;
  cumulativeRevenue: number;
  remainingRevenue: number;
  progressBasis: string;
  reestimateAdjustment?: number;
}

export interface RevenueScheduleResult {
  performanceObligationId: string;
  recognitionMethod: RecognitionMethod;
  totalAllocatedAmount: number;
  schedule: RevenueScheduleEntry[];
  summary: {
    totalRecognized: number;
    totalRemaining: number;
    completionPercentage: number;
    lastUpdateDate: Date;
  };
  reestimateHistory: ReestimateAdjustment[];
}

export interface ReestimateAdjustment {
  adjustmentDate: Date;
  reason: string;
  previousEstimate: number;
  newEstimate: number;
  cumulativeCatchUpAdjustment: number;
  affectedPeriods: string[];
}

@Injectable()
export class RevenueScheduleService {
  private readonly logger = new Logger(RevenueScheduleService.name);

  /**
   * Generates revenue recognition schedule for a performance obligation
   */
  async generateRevenueSchedule(
    input: PerformanceObligationScheduleInput
  ): Promise<RevenueScheduleResult> {
    this.logger.log(`Generating revenue schedule for PO ${input.performanceObligationId}`);

    if (input.recognitionMethod === 'POINT_IN_TIME') {
      return this.generatePointInTimeSchedule(input);
    } else {
      return this.generateOverTimeSchedule(input);
    }
  }

  /**
   * Generates point-in-time revenue recognition schedule
   */
  private generatePointInTimeSchedule(
    input: PerformanceObligationScheduleInput
  ): RevenueScheduleResult {
    if (!input.controlTransferDate) {
      throw new Error('Control transfer date is required for point-in-time recognition');
    }

    const scheduleEntry: RevenueScheduleEntry = {
      periodEndDate: input.controlTransferDate,
      periodStartDate: input.controlTransferDate,
      progressPercentage: 100,
      revenueAmount: input.allocatedAmount,
      cumulativeRevenue: input.allocatedAmount,
      remainingRevenue: 0,
      progressBasis: 'CONTROL_TRANSFER'
    };

    return {
      performanceObligationId: input.performanceObligationId,
      recognitionMethod: 'POINT_IN_TIME',
      totalAllocatedAmount: input.allocatedAmount,
      schedule: [scheduleEntry],
      summary: {
        totalRecognized: input.allocatedAmount,
        totalRemaining: 0,
        completionPercentage: 100,
        lastUpdateDate: input.controlTransferDate
      },
      reestimateHistory: []
    };
  }

  /**
   * Generates over-time revenue recognition schedule
   */
  private generateOverTimeSchedule(
    input: PerformanceObligationScheduleInput
  ): RevenueScheduleResult {
    if (!input.contractStartDate || !input.contractEndDate) {
      throw new Error('Contract start and end dates are required for over-time recognition');
    }

    const schedule: RevenueScheduleEntry[] = [];
    const reestimateHistory: ReestimateAdjustment[] = [];
    
    let cumulativeRevenue = 0;
    let previousProgressPercentage = 0;

    // Generate schedule based on periodic updates or monthly periods
    const periods = this.generatePeriods(input.contractStartDate, input.contractEndDate, input.periodicUpdates);

    for (let i = 0; i < periods.length; i++) {
      const period = periods[i];
      const progressData = this.calculateProgress(input, period, i);
      
      // Handle reestimates
      const reestimateAdjustment = this.calculateReestimateAdjustment(
        input, 
        progressData, 
        previousProgressPercentage, 
        cumulativeRevenue
      );

      if (reestimateAdjustment) {
        reestimateHistory.push(reestimateAdjustment);
      }

      const currentProgressPercentage = Math.min(100, progressData.progressPercentage);
      const targetCumulativeRevenue = input.allocatedAmount * (currentProgressPercentage / 100);
      const periodRevenue = targetCumulativeRevenue - cumulativeRevenue + (reestimateAdjustment?.cumulativeCatchUpAdjustment || 0);

      cumulativeRevenue += periodRevenue;
      const remainingRevenue = input.allocatedAmount - cumulativeRevenue;

      const scheduleEntry: RevenueScheduleEntry = {
        periodEndDate: period.endDate,
        periodStartDate: period.startDate,
        progressPercentage: currentProgressPercentage,
        revenueAmount: periodRevenue,
        cumulativeRevenue,
        remainingRevenue: Math.max(0, remainingRevenue),
        progressBasis: this.getProgressBasisDescription(input.progressMeasurement),
        reestimateAdjustment: reestimateAdjustment?.cumulativeCatchUpAdjustment
      };

      schedule.push(scheduleEntry);
      previousProgressPercentage = currentProgressPercentage;
    }

    const lastEntry = schedule[schedule.length - 1];

    return {
      performanceObligationId: input.performanceObligationId,
      recognitionMethod: 'OVER_TIME',
      totalAllocatedAmount: input.allocatedAmount,
      schedule,
      summary: {
        totalRecognized: cumulativeRevenue,
        totalRemaining: Math.max(0, input.allocatedAmount - cumulativeRevenue),
        completionPercentage: lastEntry?.progressPercentage || 0,
        lastUpdateDate: lastEntry?.periodEndDate || new Date()
      },
      reestimateHistory
    };
  }

  /**
   * Generates periods for revenue recognition
   */
  private generatePeriods(
    startDate: Date, 
    endDate: Date, 
    periodicUpdates?: PeriodicProgressUpdate[]
  ): Array<{ startDate: Date; endDate: Date; update?: PeriodicProgressUpdate }> {
    const periods: Array<{ startDate: Date; endDate: Date; update?: PeriodicProgressUpdate }> = [];

    if (periodicUpdates && periodicUpdates.length > 0) {
      // Use periodic updates as period boundaries
      let currentStart = startDate;
      
      for (const update of periodicUpdates.sort((a, b) => a.periodEndDate.getTime() - b.periodEndDate.getTime())) {
        periods.push({
          startDate: currentStart,
          endDate: update.periodEndDate,
          update
        });
        currentStart = new Date(update.periodEndDate.getTime() + 24 * 60 * 60 * 1000); // Next day
      }

      // Add final period if needed
      if (currentStart < endDate) {
        periods.push({
          startDate: currentStart,
          endDate: endDate
        });
      }
    } else {
      // Generate monthly periods
      let currentDate = new Date(startDate);
      
      while (currentDate < endDate) {
        const periodEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
        const actualPeriodEnd = periodEnd > endDate ? endDate : periodEnd;
        
        periods.push({
          startDate: new Date(currentDate),
          endDate: actualPeriodEnd
        });
        
        currentDate = new Date(actualPeriodEnd.getTime() + 24 * 60 * 60 * 1000);
      }
    }

    return periods;
  }

  /**
   * Calculates progress percentage based on measurement method
   */
  private calculateProgress(
    input: PerformanceObligationScheduleInput,
    period: { startDate: Date; endDate: Date; update?: PeriodicProgressUpdate },
    periodIndex: number
  ): { progressPercentage: number; basis: string } {
    if (period.update) {
      // Use actual progress data from periodic update
      switch (input.progressMeasurement) {
        case 'COST_TO_COST':
          const totalCosts = period.update.revisedTotalEstimatedCosts || input.totalEstimatedCosts || 1;
          return {
            progressPercentage: (period.update.actualCostsIncurred / totalCosts) * 100,
            basis: `Costs incurred: ${period.update.actualCostsIncurred} / ${totalCosts}`
          };

        case 'UNITS_OF_DELIVERY':
          const totalUnits = period.update.revisedTotalEstimatedUnits || input.totalEstimatedUnits || 1;
          return {
            progressPercentage: (period.update.actualUnitsDelivered / totalUnits) * 100,
            basis: `Units delivered: ${period.update.actualUnitsDelivered} / ${totalUnits}`
          };

        case 'VALUE_OF_DELIVERY':
          const totalValue = period.update.revisedTotalEstimatedValue || input.totalEstimatedValue || 1;
          return {
            progressPercentage: (period.update.actualValueDelivered / totalValue) * 100,
            basis: `Value delivered: ${period.update.actualValueDelivered} / ${totalValue}`
          };

        case 'TIME_ELAPSED':
        default:
          return this.calculateTimeElapsedProgress(input, period.endDate);
      }
    } else {
      // Use time-elapsed method as default
      return this.calculateTimeElapsedProgress(input, period.endDate);
    }
  }

  /**
   * Calculates progress based on time elapsed
   */
  private calculateTimeElapsedProgress(
    input: PerformanceObligationScheduleInput,
    currentDate: Date
  ): { progressPercentage: number; basis: string } {
    if (!input.contractStartDate || !input.contractEndDate) {
      return { progressPercentage: 0, basis: 'Missing contract dates' };
    }

    const totalDuration = input.contractEndDate.getTime() - input.contractStartDate.getTime();
    const elapsedDuration = Math.min(
      currentDate.getTime() - input.contractStartDate.getTime(),
      totalDuration
    );

    const progressPercentage = totalDuration > 0 ? (elapsedDuration / totalDuration) * 100 : 0;

    return {
      progressPercentage: Math.max(0, progressPercentage),
      basis: `Time elapsed: ${Math.round(elapsedDuration / (24 * 60 * 60 * 1000))} / ${Math.round(totalDuration / (24 * 60 * 60 * 1000))} days`
    };
  }

  /**
   * Calculates reestimate adjustments for cumulative catch-up
   */
  private calculateReestimateAdjustment(
    input: PerformanceObligationScheduleInput,
    progressData: { progressPercentage: number; basis: string },
    previousProgressPercentage: number,
    cumulativeRevenue: number
  ): ReestimateAdjustment | null {
    // This is a simplified implementation - in practice, you'd compare
    // current estimates with previous estimates to determine if reestimation is needed
    
    // For demonstration, we'll trigger a reestimate if there's a significant change
    const progressChange = progressData.progressPercentage - previousProgressPercentage;
    
    if (Math.abs(progressChange) > 10 && progressData.progressPercentage > 0) {
      const expectedCumulativeRevenue = input.allocatedAmount * (progressData.progressPercentage / 100);
      const adjustment = expectedCumulativeRevenue - cumulativeRevenue;

      if (Math.abs(adjustment) > input.allocatedAmount * 0.05) { // 5% threshold
        return {
          adjustmentDate: new Date(),
          reason: `Significant progress change detected: ${progressChange.toFixed(1)}%`,
          previousEstimate: cumulativeRevenue,
          newEstimate: expectedCumulativeRevenue,
          cumulativeCatchUpAdjustment: adjustment,
          affectedPeriods: ['Current period']
        };
      }
    }

    return null;
  }

  /**
   * Gets human-readable description of progress basis
   */
  private getProgressBasisDescription(method?: ProgressMeasurement): string {
    switch (method) {
      case 'COST_TO_COST':
        return 'Cost-to-cost (input method)';
      case 'UNITS_OF_DELIVERY':
        return 'Units of delivery (output method)';
      case 'VALUE_OF_DELIVERY':
        return 'Value of delivery (output method)';
      case 'TIME_ELAPSED':
        return 'Time elapsed (straight-line)';
      default:
        return 'Time elapsed (default)';
    }
  }

  /**
   * Validates revenue schedule input
   */
  validateScheduleInput(input: PerformanceObligationScheduleInput): string[] {
    const errors: string[] = [];

    if (!input.performanceObligationId) {
      errors.push('Performance obligation ID is required');
    }

    if (input.allocatedAmount <= 0) {
      errors.push('Allocated amount must be greater than zero');
    }

    if (input.recognitionMethod === 'POINT_IN_TIME') {
      if (!input.controlTransferDate) {
        errors.push('Control transfer date is required for point-in-time recognition');
      }
    } else if (input.recognitionMethod === 'OVER_TIME') {
      if (!input.contractStartDate || !input.contractEndDate) {
        errors.push('Contract start and end dates are required for over-time recognition');
      }

      if (input.contractStartDate && input.contractEndDate && input.contractStartDate >= input.contractEndDate) {
        errors.push('Contract start date must be before end date');
      }

      if (input.progressMeasurement === 'COST_TO_COST' && !input.totalEstimatedCosts) {
        errors.push('Total estimated costs required for cost-to-cost progress measurement');
      }

      if (input.progressMeasurement === 'UNITS_OF_DELIVERY' && !input.totalEstimatedUnits) {
        errors.push('Total estimated units required for units of delivery progress measurement');
      }

      if (input.progressMeasurement === 'VALUE_OF_DELIVERY' && !input.totalEstimatedValue) {
        errors.push('Total estimated value required for value of delivery progress measurement');
      }
    }

    return errors;
  }
}

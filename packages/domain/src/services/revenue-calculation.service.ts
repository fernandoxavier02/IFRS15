import { PerformanceObligationEntity } from '../entities';
import { SatisfactionMethod } from '@ifrs15/shared';

export interface ProgressMeasurement {
  method: 'input' | 'output';
  actualValue: number;
  totalEstimatedValue: number;
  measurementDate: Date;
}

export class RevenueCalculationService {
  // Calculate progress percentage based on different methods
  calculateProgress(
    performanceObligation: PerformanceObligationEntity,
    measurement: ProgressMeasurement
  ): number {
    if (performanceObligation.satisfactionMethod !== SatisfactionMethod.OVER_TIME) {
      throw new Error('Progress calculation only applies to over-time satisfaction method');
    }

    if (measurement.totalEstimatedValue === 0) {
      return 0;
    }

    const progressPercentage = (measurement.actualValue / measurement.totalEstimatedValue) * 100;
    return Math.min(Math.max(progressPercentage, 0), 100);
  }

  // Input method: costs incurred to date / total estimated costs
  calculateInputMethodProgress(
    costsIncurred: number,
    totalEstimatedCosts: number
  ): ProgressMeasurement {
    return {
      method: 'input',
      actualValue: costsIncurred,
      totalEstimatedValue: totalEstimatedCosts,
      measurementDate: new Date(),
    };
  }

  // Output method: units delivered / total units to be delivered
  calculateOutputMethodProgress(
    unitsDelivered: number,
    totalUnits: number
  ): ProgressMeasurement {
    return {
      method: 'output',
      actualValue: unitsDelivered,
      totalEstimatedValue: totalUnits,
      measurementDate: new Date(),
    };
  }

  // Calculate revenue to recognize based on progress
  calculateRevenueToRecognize(
    performanceObligation: PerformanceObligationEntity,
    progressPercentage: number
  ): number {
    if (performanceObligation.satisfactionMethod === SatisfactionMethod.POINT_IN_TIME) {
      // For point-in-time, revenue is recognized when control transfers (0% or 100%)
      return progressPercentage >= 100 ? performanceObligation.allocatedAmount : 0;
    }

    // For over-time, calculate cumulative revenue to recognize
    const cumulativeRevenue = (performanceObligation.allocatedAmount * progressPercentage) / 100;
    const revenueToRecognize = cumulativeRevenue - performanceObligation.recognizedAmount;

    return Math.max(0, revenueToRecognize);
  }

  // Calculate contract completion percentage
  calculateContractCompletion(performanceObligations: PerformanceObligationEntity[]): number {
    if (performanceObligations.length === 0) {
      return 0;
    }

    const totalAllocated = performanceObligations.reduce((sum, po) => sum + po.allocatedAmount, 0);
    const totalRecognized = performanceObligations.reduce((sum, po) => sum + po.recognizedAmount, 0);

    if (totalAllocated === 0) {
      return 0;
    }

    return (totalRecognized / totalAllocated) * 100;
  }

  // Estimate completion date based on current progress
  estimateCompletionDate(
    performanceObligation: PerformanceObligationEntity,
    currentProgress: ProgressMeasurement
  ): Date | null {
    if (performanceObligation.satisfactionMethod === SatisfactionMethod.POINT_IN_TIME) {
      return performanceObligation.estimatedCompletionDate || null;
    }

    const progressPercentage = this.calculateProgress(performanceObligation, currentProgress);
    
    if (progressPercentage === 0) {
      return null;
    }

    const startDate = performanceObligation.createdAt;
    const currentDate = new Date();
    const daysElapsed = Math.floor((currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    
    const estimatedTotalDays = (daysElapsed / progressPercentage) * 100;
    const estimatedCompletionDate = new Date(startDate);
    estimatedCompletionDate.setDate(startDate.getDate() + estimatedTotalDays);

    return estimatedCompletionDate;
  }

  // Validate progress measurement
  validateProgressMeasurement(measurement: ProgressMeasurement): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (measurement.actualValue < 0) {
      errors.push('Actual value cannot be negative');
    }

    if (measurement.totalEstimatedValue <= 0) {
      errors.push('Total estimated value must be positive');
    }

    if (measurement.actualValue > measurement.totalEstimatedValue) {
      errors.push('Actual value cannot exceed total estimated value');
    }

    if (measurement.measurementDate > new Date()) {
      errors.push('Measurement date cannot be in the future');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

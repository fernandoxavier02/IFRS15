import {
  ContractPolicy,
  PriceAllocationPlan,
  PriceAllocationItem,
  RevenueSchedule,
  RevenueScheduleItem,
  ContractBalance,
  AccountingEntry,
  PerformanceObligationPolicy
} from './types';

// ============================================================================
// IFRS 15 POLICY ENGINE - CALCULATORS
// ============================================================================

export class PriceAllocationCalculator {
  
  /**
   * Calculates price allocation across performance obligations
   */
  public calculatePriceAllocation(policy: ContractPolicy): PriceAllocationPlan {
    const allocations: PriceAllocationItem[] = [];
    
    // Determine allocation method
    const allocationMethod = this.determineAllocationMethod(policy);
    
    // Calculate standalone selling prices
    const sspData = this.calculateStandaloneSellingPrices(policy);
    
    // Allocate transaction price
    for (const po of policy.performanceObligations) {
      const ssp = sspData.find(s => s.poId === po.id)?.ssp || 0;
      const allocation = this.allocateToPerformanceObligation(
        po,
        ssp,
        policy.transactionPrice,
        sspData.totalSSP,
        allocationMethod
      );
      
      allocations.push(allocation);
    }
    
    // Handle discounts and variable consideration
    this.adjustForDiscounts(allocations, policy.transactionPrice, sspData.totalSSP);
    
    return {
      contractId: policy.contractId,
      totalTransactionPrice: policy.transactionPrice,
      allocationMethod,
      allocations,
      variableConsiderationTreatment: policy.variableConsiderationConstraint,
      discountAllocation: sspData.totalSSP > policy.transactionPrice 
        ? sspData.totalSSP - policy.transactionPrice 
        : undefined
    };
  }
  
  private determineAllocationMethod(policy: ContractPolicy): 'STANDALONE_PRICE' | 'RESIDUAL' | 'COST_PLUS_MARGIN' {
    const obligationsWithSSP = policy.performanceObligations.filter(po => po.standaloneSellingPrice);
    const obligationsWithoutSSP = policy.performanceObligations.filter(po => !po.standaloneSellingPrice);
    
    if (obligationsWithoutSSP.length === 1 && obligationsWithSSP.length > 0) {
      return 'RESIDUAL';
    }
    
    if (obligationsWithSSP.length === policy.performanceObligations.length) {
      return 'STANDALONE_PRICE';
    }
    
    return 'COST_PLUS_MARGIN';
  }
  
  private calculateStandaloneSellingPrices(policy: ContractPolicy): {
    poId: string;
    ssp: number;
  }[] & { totalSSP: number } {
    const sspData = policy.performanceObligations.map(po => ({
      poId: po.id,
      ssp: po.standaloneSellingPrice || this.estimateSSP(po, policy)
    }));
    
    const totalSSP = sspData.reduce((sum, item) => sum + item.ssp, 0);
    
    return Object.assign(sspData, { totalSSP });
  }
  
  private estimateSSP(po: PerformanceObligationPolicy, policy: ContractPolicy): number {
    // Simplified SSP estimation - in practice, this would be more sophisticated
    const totalAllocatedSSP = policy.performanceObligations
      .filter(p => p.standaloneSellingPrice && p.id !== po.id)
      .reduce((sum, p) => sum + (p.standaloneSellingPrice || 0), 0);
    
    const remainingObligations = policy.performanceObligations.filter(p => !p.standaloneSellingPrice).length;
    
    if (remainingObligations > 0) {
      return Math.max(0, (policy.transactionPrice - totalAllocatedSSP) / remainingObligations);
    }
    
    return policy.transactionPrice * 0.1; // Default 10% allocation
  }
  
  private allocateToPerformanceObligation(
    po: PerformanceObligationPolicy,
    ssp: number,
    totalTransactionPrice: number,
    totalSSP: number,
    method: 'STANDALONE_PRICE' | 'RESIDUAL' | 'COST_PLUS_MARGIN'
  ): PriceAllocationItem {
    let allocatedAmount: number;
    let allocationPercentage: number;
    
    switch (method) {
      case 'STANDALONE_PRICE':
        allocationPercentage = totalSSP > 0 ? ssp / totalSSP : 0;
        allocatedAmount = totalTransactionPrice * allocationPercentage;
        break;
        
      case 'RESIDUAL':
        if (po.standaloneSellingPrice) {
          allocationPercentage = ssp / totalSSP;
          allocatedAmount = totalTransactionPrice * allocationPercentage;
        } else {
          // This is the residual PO
          const allocatedToOthers = totalTransactionPrice - ssp;
          allocatedAmount = Math.max(0, totalTransactionPrice - allocatedToOthers);
          allocationPercentage = allocatedAmount / totalTransactionPrice;
        }
        break;
        
      default:
        allocationPercentage = po.allocationWeight || (1 / totalSSP);
        allocatedAmount = totalTransactionPrice * allocationPercentage;
    }
    
    return {
      performanceObligationId: po.id,
      standaloneSellingPrice: ssp,
      allocationBasis: method,
      allocatedAmount,
      allocationPercentage,
      adjustments: []
    };
  }
  
  private adjustForDiscounts(
    allocations: PriceAllocationItem[],
    transactionPrice: number,
    totalSSP: number
  ): void {
    const totalAllocated = allocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0);
    const difference = transactionPrice - totalAllocated;
    
    if (Math.abs(difference) > 0.01) {
      // Proportionally adjust allocations
      const adjustmentFactor = transactionPrice / totalAllocated;
      
      for (const allocation of allocations) {
        const adjustment = allocation.allocatedAmount * (adjustmentFactor - 1);
        allocation.allocatedAmount *= adjustmentFactor;
        allocation.allocationPercentage = allocation.allocatedAmount / transactionPrice;
        
        if (Math.abs(adjustment) > 0.01) {
          allocation.adjustments = allocation.adjustments || [];
          allocation.adjustments.push({
            type: 'DISCOUNT_ALLOCATION',
            amount: adjustment,
            reason: 'Proportional discount allocation'
          });
        }
      }
    }
  }
}

export class RevenueScheduleCalculator {
  
  /**
   * Generates revenue recognition schedule for a performance obligation
   */
  public calculateRevenueSchedule(
    po: PerformanceObligationPolicy,
    allocatedAmount: number,
    contractStartDate: Date,
    contractEndDate: Date,
    policy: ContractPolicy
  ): RevenueSchedule {
    const schedule: RevenueScheduleItem[] = [];
    
    if (po.satisfactionTiming === 'AT_POINT_IN_TIME') {
      schedule.push(this.createPointInTimeScheduleItem(po, allocatedAmount, contractStartDate));
    } else {
      schedule.push(...this.createOverTimeScheduleItems(
        po,
        allocatedAmount,
        contractStartDate,
        contractEndDate,
        policy
      ));
    }
    
    return {
      contractId: policy.contractId,
      performanceObligationId: po.id,
      totalAllocatedAmount: allocatedAmount,
      recognitionMethod: po.revenueRecognitionMethod,
      schedule,
      completionDate: contractEndDate.toISOString(),
      estimatedDuration: this.calculateDurationMonths(contractStartDate, contractEndDate)
    };
  }
  
  private createPointInTimeScheduleItem(
    po: PerformanceObligationPolicy,
    amount: number,
    date: Date
  ): RevenueScheduleItem {
    return {
      date: date.toISOString(),
      performanceObligationId: po.id,
      recognizedAmount: amount,
      cumulativeAmount: amount,
      progressPercentage: 1.0,
      progressMeasurement: 'Control transferred at point in time'
    };
  }
  
  private createOverTimeScheduleItems(
    po: PerformanceObligationPolicy,
    totalAmount: number,
    startDate: Date,
    endDate: Date,
    policy: ContractPolicy
  ): RevenueScheduleItem[] {
    const items: RevenueScheduleItem[] = [];
    const durationMonths = this.calculateDurationMonths(startDate, endDate);
    
    switch (po.revenueRecognitionMethod) {
      case 'OVER_TIME_INPUT':
        return this.calculateInputBasedSchedule(po, totalAmount, startDate, endDate, durationMonths);
        
      case 'OVER_TIME_OUTPUT':
        return this.calculateOutputBasedSchedule(po, totalAmount, startDate, endDate, durationMonths);
        
      case 'OVER_TIME_MILESTONE':
        return this.calculateMilestoneBasedSchedule(po, totalAmount, startDate, endDate);
        
      case 'OVER_TIME_COST_TO_COST':
        return this.calculateCostToCostSchedule(po, totalAmount, startDate, endDate, durationMonths);
        
      default:
        return this.calculateStraightLineSchedule(po, totalAmount, startDate, endDate, durationMonths);
    }
  }
  
  private calculateInputBasedSchedule(
    po: PerformanceObligationPolicy,
    totalAmount: number,
    startDate: Date,
    endDate: Date,
    durationMonths: number
  ): RevenueScheduleItem[] {
    const items: RevenueScheduleItem[] = [];
    let cumulativeAmount = 0;
    
    for (let month = 0; month <= durationMonths; month++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + month);
      
      const progressPercentage = month / durationMonths;
      const recognizedAmount = month === 0 ? 0 : totalAmount / durationMonths;
      cumulativeAmount += recognizedAmount;
      
      items.push({
        date: currentDate.toISOString(),
        performanceObligationId: po.id,
        recognizedAmount,
        cumulativeAmount,
        progressPercentage,
        progressMeasurement: `Input-based progress: ${po.progressMetric}`
      });
    }
    
    return items;
  }
  
  private calculateOutputBasedSchedule(
    po: PerformanceObligationPolicy,
    totalAmount: number,
    startDate: Date,
    endDate: Date,
    durationMonths: number
  ): RevenueScheduleItem[] {
    const items: RevenueScheduleItem[] = [];
    let cumulativeAmount = 0;
    
    // Simplified output-based calculation
    const outputMilestones = [0.2, 0.4, 0.6, 0.8, 1.0]; // 20%, 40%, 60%, 80%, 100%
    
    for (let i = 0; i < outputMilestones.length; i++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + Math.floor((durationMonths * outputMilestones[i])));
      
      const progressPercentage = outputMilestones[i];
      const targetCumulative = totalAmount * progressPercentage;
      const recognizedAmount = targetCumulative - cumulativeAmount;
      cumulativeAmount = targetCumulative;
      
      items.push({
        date: currentDate.toISOString(),
        performanceObligationId: po.id,
        recognizedAmount,
        cumulativeAmount,
        progressPercentage,
        progressMeasurement: `Output delivered: ${progressPercentage * 100}%`
      });
    }
    
    return items;
  }
  
  private calculateMilestoneBasedSchedule(
    po: PerformanceObligationPolicy,
    totalAmount: number,
    startDate: Date,
    endDate: Date
  ): RevenueScheduleItem[] {
    const items: RevenueScheduleItem[] = [];
    
    // Simplified milestone calculation - equal milestones
    const milestones = [
      { date: new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * 0.25), percentage: 0.25 },
      { date: new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * 0.5), percentage: 0.5 },
      { date: new Date(startDate.getTime() + (endDate.getTime() - startDate.getTime()) * 0.75), percentage: 0.75 },
      { date: endDate, percentage: 1.0 }
    ];
    
    let cumulativeAmount = 0;
    
    for (const milestone of milestones) {
      const targetCumulative = totalAmount * milestone.percentage;
      const recognizedAmount = targetCumulative - cumulativeAmount;
      cumulativeAmount = targetCumulative;
      
      items.push({
        date: milestone.date.toISOString(),
        performanceObligationId: po.id,
        recognizedAmount,
        cumulativeAmount,
        progressPercentage: milestone.percentage,
        progressMeasurement: `Milestone ${milestone.percentage * 100}% achieved`
      });
    }
    
    return items;
  }
  
  private calculateCostToCostSchedule(
    po: PerformanceObligationPolicy,
    totalAmount: number,
    startDate: Date,
    endDate: Date,
    durationMonths: number
  ): RevenueScheduleItem[] {
    const items: RevenueScheduleItem[] = [];
    let cumulativeAmount = 0;
    
    // Simplified cost-to-cost calculation with accelerated early progress
    const costProgressCurve = [0, 0.15, 0.35, 0.55, 0.75, 0.9, 1.0];
    
    for (let month = 0; month < costProgressCurve.length; month++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + Math.floor((durationMonths * month) / (costProgressCurve.length - 1)));
      
      const progressPercentage = costProgressCurve[month];
      const targetCumulative = totalAmount * progressPercentage;
      const recognizedAmount = targetCumulative - cumulativeAmount;
      cumulativeAmount = targetCumulative;
      
      items.push({
        date: currentDate.toISOString(),
        performanceObligationId: po.id,
        recognizedAmount,
        cumulativeAmount,
        progressPercentage,
        progressMeasurement: `Cost-to-cost progress: ${progressPercentage * 100}%`
      });
    }
    
    return items;
  }
  
  private calculateStraightLineSchedule(
    po: PerformanceObligationPolicy,
    totalAmount: number,
    startDate: Date,
    endDate: Date,
    durationMonths: number
  ): RevenueScheduleItem[] {
    const items: RevenueScheduleItem[] = [];
    const monthlyAmount = totalAmount / durationMonths;
    let cumulativeAmount = 0;
    
    for (let month = 0; month <= durationMonths; month++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(currentDate.getMonth() + month);
      
      const recognizedAmount = month === 0 ? 0 : monthlyAmount;
      cumulativeAmount += recognizedAmount;
      const progressPercentage = month / durationMonths;
      
      items.push({
        date: currentDate.toISOString(),
        performanceObligationId: po.id,
        recognizedAmount,
        cumulativeAmount,
        progressPercentage,
        progressMeasurement: `Straight-line progress: ${progressPercentage * 100}%`
      });
    }
    
    return items;
  }
  
  private calculateDurationMonths(startDate: Date, endDate: Date): number {
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.ceil(diffDays / 30); // Approximate months
  }
}

export class ContractBalanceCalculator {
  
  /**
   * Calculates contract balances at a specific date
   */
  public calculateContractBalance(
    policy: ContractPolicy,
    priceAllocation: PriceAllocationPlan,
    revenueSchedules: RevenueSchedule[],
    asOfDate: Date,
    billedToDate: number = 0,
    costsIncurred: number = 0
  ): ContractBalance {
    const recognizedToDate = this.calculateRecognizedRevenue(revenueSchedules, asOfDate);
    const totalContractValue = priceAllocation.totalTransactionPrice;
    const remainingToRecognize = totalContractValue - recognizedToDate;
    
    // Contract asset: Revenue recognized but not yet billed
    const contractAsset = Math.max(0, recognizedToDate - billedToDate);
    
    // Contract liability: Billed but not yet recognized as revenue
    const contractLiability = Math.max(0, billedToDate - recognizedToDate);
    
    // Unbilled revenue (same as contract asset in this simplified model)
    const unbilledRevenue = contractAsset;
    
    // Deferred revenue (same as contract liability)
    const deferredRevenue = contractLiability;
    
    // Incremental costs (simplified)
    const incrementalCosts = costsIncurred;
    
    // Refund liability (simplified - could be more complex based on contract terms)
    const refundLiability = this.calculateRefundLiability(policy, recognizedToDate);
    
    return {
      contractId: policy.contractId,
      asOfDate: asOfDate.toISOString(),
      contractAsset,
      contractLiability,
      refundLiability,
      unbilledRevenue,
      deferredRevenue,
      incrementalCosts,
      totalContractValue,
      recognizedToDate,
      remainingToRecognize
    };
  }
  
  private calculateRecognizedRevenue(schedules: RevenueSchedule[], asOfDate: Date): number {
    return schedules.reduce((total, schedule) => {
      const recognizedInSchedule = schedule.schedule
        .filter(item => new Date(item.date) <= asOfDate)
        .reduce((sum, item) => sum + item.recognizedAmount, 0);
      
      return total + recognizedInSchedule;
    }, 0);
  }
  
  private calculateRefundLiability(policy: ContractPolicy, recognizedToDate: number): number {
    // Simplified refund liability calculation
    // In practice, this would consider contract terms, return policies, etc.
    const hasRefundProvisions = policy.performanceObligations.some(po => 
      po.warrantyClassification === 'SERVICE_WARRANTY'
    );
    
    if (hasRefundProvisions) {
      return recognizedToDate * 0.02; // 2% provision for refunds
    }
    
    return 0;
  }
}

export class AccountingEntryGenerator {
  
  /**
   * Generates suggested accounting entries for revenue recognition
   */
  public generateAccountingEntries(
    policy: ContractPolicy,
    revenueSchedules: RevenueSchedule[],
    contractBalance: ContractBalance,
    periodStartDate: Date,
    periodEndDate: Date
  ): AccountingEntry[] {
    const entries: AccountingEntry[] = [];
    
    // Generate revenue recognition entries
    for (const schedule of revenueSchedules) {
      const periodItems = schedule.schedule.filter(item => {
        const itemDate = new Date(item.date);
        return itemDate >= periodStartDate && itemDate <= periodEndDate;
      });
      
      for (const item of periodItems) {
        if (item.recognizedAmount > 0) {
          entries.push({
            date: item.date,
            description: `Revenue recognition for PO ${item.performanceObligationId}`,
            debitAccount: 'Contract Asset',
            creditAccount: 'Revenue',
            amount: item.recognizedAmount,
            performanceObligationId: item.performanceObligationId,
            reference: `${policy.contractId}-${item.performanceObligationId}`,
            entryType: 'REVENUE_RECOGNITION'
          });
        }
      }
    }
    
    // Generate contract balance entries
    if (contractBalance.contractAsset > 0) {
      entries.push({
        date: periodEndDate.toISOString(),
        description: 'Contract asset recognition',
        debitAccount: 'Contract Asset',
        creditAccount: 'Accounts Receivable',
        amount: contractBalance.contractAsset,
        reference: `${policy.contractId}-asset`,
        entryType: 'CONTRACT_ASSET'
      });
    }
    
    if (contractBalance.contractLiability > 0) {
      entries.push({
        date: periodEndDate.toISOString(),
        description: 'Contract liability recognition',
        debitAccount: 'Cash',
        creditAccount: 'Contract Liability',
        amount: contractBalance.contractLiability,
        reference: `${policy.contractId}-liability`,
        entryType: 'CONTRACT_LIABILITY'
      });
    }
    
    if (contractBalance.refundLiability > 0) {
      entries.push({
        date: periodEndDate.toISOString(),
        description: 'Refund liability provision',
        debitAccount: 'Revenue',
        creditAccount: 'Refund Liability',
        amount: contractBalance.refundLiability,
        reference: `${policy.contractId}-refund`,
        entryType: 'REFUND_LIABILITY'
      });
    }
    
    return entries;
  }
}

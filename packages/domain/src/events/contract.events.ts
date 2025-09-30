import { DomainEvent } from './domain-event';
import { ContractStatus } from '@ifrs15/shared';

export class ContractCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly contractNumber: string,
    public readonly customerId: string,
    public readonly totalValue: number
  ) {
    super(aggregateId, tenantId);
  }

  getEventName(): string {
    return 'ContractCreated';
  }
}

export class ContractActivatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly contractNumber: string
  ) {
    super(aggregateId, tenantId);
  }

  getEventName(): string {
    return 'ContractActivated';
  }
}

export class ContractCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly contractNumber: string,
    public readonly totalRevenueRecognized: number
  ) {
    super(aggregateId, tenantId);
  }

  getEventName(): string {
    return 'ContractCompleted';
  }
}

export class ContractCancelledEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly contractNumber: string,
    public readonly reason?: string
  ) {
    super(aggregateId, tenantId);
  }

  getEventName(): string {
    return 'ContractCancelled';
  }
}

export class ContractModifiedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly contractNumber: string,
    public readonly modifications: Record<string, any>
  ) {
    super(aggregateId, tenantId);
  }

  getEventName(): string {
    return 'ContractModified';
  }
}

export class PerformanceObligationAddedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly performanceObligationId: string,
    public readonly description: string,
    public readonly allocatedAmount: number
  ) {
    super(aggregateId, tenantId);
  }

  getEventName(): string {
    return 'PerformanceObligationAdded';
  }
}

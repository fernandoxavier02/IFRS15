import { DomainEvent } from './domain-event';

export class RevenueRecognizedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly contractId: string,
    public readonly performanceObligationId: string,
    public readonly amount: number,
    public readonly period: string
  ) {
    super(aggregateId, tenantId);
  }

  getEventName(): string {
    return 'RevenueRecognized';
  }
}

export class RevenueReversedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly contractId: string,
    public readonly performanceObligationId: string,
    public readonly amount: number,
    public readonly reason: string
  ) {
    super(aggregateId, tenantId);
  }

  getEventName(): string {
    return 'RevenueReversed';
  }
}

export class RevenueCalculatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    tenantId: string,
    public readonly contractId: string,
    public readonly totalCalculatedRevenue: number,
    public readonly period: string
  ) {
    super(aggregateId, tenantId);
  }

  getEventName(): string {
    return 'RevenueCalculated';
  }
}

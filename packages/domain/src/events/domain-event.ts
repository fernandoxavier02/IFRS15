export abstract class DomainEvent {
  public readonly occurredAt: Date;
  public readonly eventId: string;
  public readonly aggregateId: string;
  public readonly tenantId: string;

  constructor(aggregateId: string, tenantId: string) {
    this.eventId = crypto.randomUUID();
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.tenantId = tenantId;
  }

  abstract getEventName(): string;
}

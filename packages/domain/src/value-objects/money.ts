export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string
  ) {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }
    if (!currency || currency.length !== 3) {
      throw new Error('Currency must be a valid 3-character code');
    }
  }

  add(other: Money): Money {
    this.ensureSameCurrency(other);
    return new Money(this.amount + other.amount, this.currency);
  }

  subtract(other: Money): Money {
    this.ensureSameCurrency(other);
    const result = this.amount - other.amount;
    if (result < 0) {
      throw new Error('Subtraction would result in negative amount');
    }
    return new Money(result, this.currency);
  }

  multiply(factor: number): Money {
    if (factor < 0) {
      throw new Error('Multiplication factor cannot be negative');
    }
    return new Money(this.amount * factor, this.currency);
  }

  divide(divisor: number): Money {
    if (divisor <= 0) {
      throw new Error('Division by zero or negative number not allowed');
    }
    return new Money(this.amount / divisor, this.currency);
  }

  equals(other: Money): boolean {
    return this.amount === other.amount && this.currency === other.currency;
  }

  isGreaterThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount > other.amount;
  }

  isLessThan(other: Money): boolean {
    this.ensureSameCurrency(other);
    return this.amount < other.amount;
  }

  private ensureSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new Error(`Currency mismatch: ${this.currency} vs ${other.currency}`);
    }
  }

  toString(): string {
    return `${this.amount} ${this.currency}`;
  }

  toJSON(): { amount: number; currency: string } {
    return {
      amount: this.amount,
      currency: this.currency,
    };
  }

  static fromJSON(data: { amount: number; currency: string }): Money {
    return new Money(data.amount, data.currency);
  }

  static zero(currency: string): Money {
    return new Money(0, currency);
  }
}

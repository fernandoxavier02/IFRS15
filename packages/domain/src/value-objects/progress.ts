export class Progress {
  private readonly _percentage: number;

  constructor(percentage: number) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('Progress percentage must be between 0 and 100');
    }
    this._percentage = percentage;
  }

  get percentage(): number {
    return this._percentage;
  }

  get decimal(): number {
    return this._percentage / 100;
  }

  isComplete(): boolean {
    return this._percentage === 100;
  }

  isStarted(): boolean {
    return this._percentage > 0;
  }

  equals(other: Progress): boolean {
    return this._percentage === other._percentage;
  }

  isGreaterThan(other: Progress): boolean {
    return this._percentage > other._percentage;
  }

  isLessThan(other: Progress): boolean {
    return this._percentage < other._percentage;
  }

  toString(): string {
    return `${this._percentage}%`;
  }

  static fromDecimal(decimal: number): Progress {
    return new Progress(decimal * 100);
  }

  static fromRatio(numerator: number, denominator: number): Progress {
    if (denominator === 0) {
      throw new Error('Denominator cannot be zero');
    }
    if (numerator < 0 || denominator < 0) {
      throw new Error('Numerator and denominator must be non-negative');
    }
    if (numerator > denominator) {
      throw new Error('Numerator cannot be greater than denominator');
    }
    return new Progress((numerator / denominator) * 100);
  }

  static zero(): Progress {
    return new Progress(0);
  }

  static complete(): Progress {
    return new Progress(100);
  }
}

export class Period {
  private readonly _year: number;
  private readonly _month: number;

  constructor(year: number, month: number) {
    if (month < 1 || month > 12) {
      throw new Error('Month must be between 1 and 12');
    }
    if (year < 1900 || year > 2100) {
      throw new Error('Year must be between 1900 and 2100');
    }
    this._year = year;
    this._month = month;
  }

  get year(): number {
    return this._year;
  }

  get month(): number {
    return this._month;
  }

  toString(): string {
    return `${this._year}-${this._month.toString().padStart(2, '0')}`;
  }

  toDate(): Date {
    return new Date(this._year, this._month - 1, 1);
  }

  getEndDate(): Date {
    return new Date(this._year, this._month, 0); // Last day of the month
  }

  equals(other: Period): boolean {
    return this._year === other._year && this._month === other._month;
  }

  isBefore(other: Period): boolean {
    if (this._year !== other._year) {
      return this._year < other._year;
    }
    return this._month < other._month;
  }

  isAfter(other: Period): boolean {
    if (this._year !== other._year) {
      return this._year > other._year;
    }
    return this._month > other._month;
  }

  addMonths(months: number): Period {
    const totalMonths = this._month + months;
    const newYear = this._year + Math.floor((totalMonths - 1) / 12);
    const newMonth = ((totalMonths - 1) % 12) + 1;
    return new Period(newYear, newMonth);
  }

  subtractMonths(months: number): Period {
    return this.addMonths(-months);
  }

  getNext(): Period {
    return this.addMonths(1);
  }

  getPrevious(): Period {
    return this.subtractMonths(1);
  }

  static fromString(periodString: string): Period {
    const match = periodString.match(/^(\d{4})-(\d{2})$/);
    if (!match) {
      throw new Error('Period string must be in YYYY-MM format');
    }
    return new Period(parseInt(match[1], 10), parseInt(match[2], 10));
  }

  static fromDate(date: Date): Period {
    return new Period(date.getFullYear(), date.getMonth() + 1);
  }

  static current(): Period {
    return Period.fromDate(new Date());
  }

  static range(start: Period, end: Period): Period[] {
    const periods: Period[] = [];
    let current = start;
    
    while (current.isBefore(end) || current.equals(end)) {
      periods.push(current);
      current = current.getNext();
    }
    
    return periods;
  }
}

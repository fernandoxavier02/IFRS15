import { Customer, Address } from '@ifrs15/shared';

export class CustomerEntity {
  constructor(
    public readonly id: string,
    public readonly tenantId: string,
    public name: string,
    public email: string | undefined,
    public taxId: string | undefined,
    public address: Address | undefined,
    public isActive: boolean = true,
    public readonly createdAt: Date = new Date(),
    public readonly updatedAt: Date = new Date()
  ) {}

  static fromCustomer(customer: Customer): CustomerEntity {
    return new CustomerEntity(
      customer.id,
      customer.tenantId,
      customer.name,
      customer.email,
      customer.taxId,
      customer.address,
      customer.isActive,
      customer.createdAt,
      customer.updatedAt
    );
  }

  toCustomer(): Customer {
    return {
      id: this.id,
      tenantId: this.tenantId,
      name: this.name,
      email: this.email,
      taxId: this.taxId,
      address: this.address,
      isActive: this.isActive,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  validate(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Customer name is required');
    }

    if (this.email && !this.isValidEmail(this.email)) {
      errors.push('Invalid email format');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  deactivate(): void {
    this.isActive = false;
  }

  activate(): void {
    this.isActive = true;
  }

  updateContactInfo(email?: string, address?: Address): void {
    if (email !== undefined) {
      if (email && !this.isValidEmail(email)) {
        throw new Error('Invalid email format');
      }
      this.email = email;
    }

    if (address !== undefined) {
      this.address = address;
    }
  }
}

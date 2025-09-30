import 'reflect-metadata';

// Global test setup for NestJS API
process.env['NODE_ENV'] = 'test';
process.env['JWT_SECRET'] = 'test-secret';
process.env['DATABASE_URL'] = 'postgresql://postgres:password@localhost:5432/ifrs15_test';

// Mock console methods in test environment
if (process.env['NODE_ENV'] === 'test') {
  global.console = {
    ...console,
    log: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

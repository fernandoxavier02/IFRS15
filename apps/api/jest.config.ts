import { Config } from 'jest';

const config: Config = {
  displayName: 'api',
  preset: '../../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../../coverage/apps/api',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.interface.ts',
    '!src/**/*.dto.ts',
    '!src/main.ts',
  ],

  testMatch: ['<rootDir>/src/**/*.(test|spec).ts'],
  moduleNameMapper: {
    '^@ifrs15/shared$': '<rootDir>/../../packages/shared/src',
    '^@ifrs15/domain$': '<rootDir>/../../packages/domain/src',
    '^@ifrs15/infra$': '<rootDir>/../../packages/infra/src',
  },
};

export default config;

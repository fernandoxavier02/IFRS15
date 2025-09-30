import { Config } from 'jest';

const config: Config = {
  displayName: 'web',
  preset: '../../jest.preset.js',
  setupFilesAfterEnv: ['<rootDir>/src/test-setup.ts'],
  coverageDirectory: '../../coverage/apps/web',
  transform: {
    '^.+\\.(ts|mjs|js|html)$': [
      'jest-preset-angular',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
        stringifyContentPathRegex: '\\.(html|svg)$',
      },
    ],
  },
  transformIgnorePatterns: ['node_modules/(?!.*\\.mjs$)'],
  snapshotSerializers: [
    'jest-preset-angular/build/serializers/no-ng-attributes',
    'jest-preset-angular/build/serializers/ng-snapshot',
    'jest-preset-angular/build/serializers/html-comment',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.spec.ts',
    '!src/**/*.stories.ts',
    '!src/main.ts',
    '!src/polyfills.ts',
    '!src/test-setup.ts',
  ],
  moduleNameMapper: {
    '^@ifrs15/shared$': '<rootDir>/../../packages/shared/src',
    '^@ifrs15/ui$': '<rootDir>/../../packages/ui/src',
  },
};

export default config;

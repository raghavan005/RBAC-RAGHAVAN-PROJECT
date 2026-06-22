module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/src/tests/setup.ts'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/tests/**',
    '!src/**/*.d.ts',
    '!src/seed.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  // Optimize test performance
  maxWorkers: 1,
  forceExit: true,
  // MongoDB Memory Server optimization
  globalSetup: undefined,
  globalTeardown: undefined,
  // Set timeout for tests to prevent hanging
  testTimeout: 30000
};
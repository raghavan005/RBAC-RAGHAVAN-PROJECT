/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src/tests"],
  testMatch: ["**/*.test.ts"],
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: { strict: false } }],
  },
  setupFiles: ["<rootDir>/src/tests/jestEnv.ts"],
  testTimeout: 30000,
};

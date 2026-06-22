// This file is loaded by Jest before any test module via setupFiles.
// It sets environment variables before any imported module can read them.
process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only-32chars";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key-for-testing-only";
process.env.NODE_ENV = "test" as string;
process.env.ALLOWED_ORIGINS = "http://localhost:3000";
// MONGODB_URI will be set by MongoMemoryServer in setup.ts beforeAll

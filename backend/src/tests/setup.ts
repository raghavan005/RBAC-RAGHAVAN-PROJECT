import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  // Set env vars BEFORE any module that reads them
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only-32chars";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key-for-testing-only";
  process.env.NODE_ENV = "test";

  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);
});

afterEach(async () => {
  // Wipe all collections between tests for isolation
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

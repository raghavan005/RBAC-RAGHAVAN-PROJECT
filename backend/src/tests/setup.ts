import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  // Set env vars BEFORE any module that reads them
  process.env.JWT_SECRET = "test-jwt-secret-key-for-testing-only-32chars";
  process.env.JWT_REFRESH_SECRET = "test-refresh-secret-key-for-testing-only";
  process.env.NODE_ENV = "test";

  // Optimize MongoMemoryServer for lower resource usage
  mongod = await MongoMemoryServer.create({
    instance: {
      // Use minimal storage engine and smaller cache
      storageEngine: 'ephemeralForTest',
      args: ['--nojournal', '--smallfiles', '--quiet'],
      // Reduce memory usage
      dbPath: undefined // Use in-memory storage
    },
    binary: {
      // Use system MongoDB if available to avoid large downloads
      skipMD5: true,
      downloadDir: process.env.HOME + '/.cache/mongodb-binaries'
    }
  });
  const uri = mongod.getUri();
  process.env.MONGODB_URI = uri;

  await mongoose.connect(uri);
}, 60000); // Increase timeout for initial setup

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

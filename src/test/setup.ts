import { beforeEach, afterAll } from "vitest";
import { promises as fs } from "fs";

const TEST_STORAGE = "/tmp/openmedia-nzb-test-storage";

// Set env before any imports
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret-for-nzb-tests";
process.env.NZB_STORAGE_DIR = TEST_STORAGE;

// Clean storage before each test
beforeEach(async () => {
  try {
    await fs.rm(TEST_STORAGE, { recursive: true, force: true });
  } catch {
    // Directory may not exist yet
  }
  await fs.mkdir(TEST_STORAGE, { recursive: true });
});

// Clean up after all tests
afterAll(async () => {
  try {
    await fs.rm(TEST_STORAGE, { recursive: true, force: true });
  } catch {
    // Ignore cleanup errors
  }
});

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.test.ts"],
    setupFiles: ["./src/test/setup.ts"],
    testTimeout: 15000,
    fileParallelism: false,
    env: {
      JWT_SECRET: "test-secret-for-nzb-tests",
      NZB_STORAGE_DIR: "/tmp/openmedia-nzb-test-storage",
      NODE_ENV: "test",
    },
  },
});

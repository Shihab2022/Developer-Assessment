import { defineConfig } from "vitest/config";
import "dotenv/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    testTimeout: 30000,
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      ALLOW_LOCAL_SANDBOX: "true",
      REDIS_ENABLED: "false",
    },
  },
});
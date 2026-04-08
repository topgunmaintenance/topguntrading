import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "test/**/*.test.ts"],
    globals: false,
    setupFiles: ["./test/setup.ts"],
  },
  resolve: {
    alias: {
      "@topgun/config": resolve(__dirname, "../../packages/config/src/index.ts"),
      "@topgun/types": resolve(__dirname, "../../packages/types/src/index.ts"),
      "@topgun/market-data": resolve(
        __dirname,
        "../../packages/market-data/src/index.ts",
      ),
    },
  },
});

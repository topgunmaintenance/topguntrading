import { defineConfig } from "vitest/config";
import { resolve } from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.{ts,tsx}"],
    globals: false,
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      "@topgun/config": resolve(__dirname, "../../packages/config/src/index.ts"),
      "@topgun/types": resolve(__dirname, "../../packages/types/src/index.ts"),
      "@topgun/ui": resolve(__dirname, "../../packages/ui/src/index.ts"),
      "@topgun/charting": resolve(
        __dirname,
        "../../packages/charting/src/index.ts",
      ),
    },
  },
});

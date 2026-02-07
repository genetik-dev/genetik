import { defineConfig } from "vitest/config";
import { resolve } from "path";

export default defineConfig({
  test: {
    globals: true,
  },
  resolve: {
    alias: {
      "@genetik/schema": resolve(__dirname, "./src/index.ts"),
    },
  },
});

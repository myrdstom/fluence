import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    // Matches the runtime Convex functions run in.
    environment: "edge-runtime",
    include: ["convex/**/*.test.ts", "src/**/*.test.ts"],
    server: { deps: { inline: ["convex-test"] } },
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: "v8",
      reportOnFailure: true,
      // React components are exercised by the Playwright tests instead.
      include: ["convex/**/*.ts", "src/lib/**/*.ts"],
      exclude: [
        "convex/_generated/**",
        "**/*.test.ts",
        "convex/test.helpers.ts",
      ],
      reporter: ["text", "json-summary", "html"],
    },
  },
});

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "prefer-arrow-callback": ["error", { allowNamedFunctions: false }],
      "object-shorthand": ["error", "always", { avoidQuotes: true }],
      "prefer-template": "error",
      "prefer-const": ["error", { destructuring: "any" }],
      "prefer-destructuring": [
        "error",
        {
          VariableDeclarator: { array: false, object: true },
          AssignmentExpression: { array: false, object: false },
        },
      ],
      "no-var": "error",
      "one-var": ["error", "never"],
      "no-else-return": ["error", { allowElseIf: false }],
      "no-lonely-if": "error",
      "no-unneeded-ternary": ["error", { defaultAssignment: false }],
      "no-param-reassign": ["error", { props: true }],
      "no-console": ["warn", { allow: ["debug", "error", "warn"] }],
      "@typescript-eslint/no-shadow": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          args: "after-used",
          ignoreRestSiblings: true,
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/consistent-type-assertions": [
        "error",
        { assertionStyle: "never" },
      ],
    },
  },
  {
    files: ["src/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["../*"],
              message: "Import through the @/ or @convex/ aliases instead.",
            },
          ],
        },
      ],
    },
  },
  {
    // Tests cast fixtures and partial mocks freely.
    files: ["**/*.test.ts", "convex/test.helpers.ts", "e2e/**"],
    rules: {
      "@typescript-eslint/consistent-type-assertions": "off",
    },
  },
  // Last, so formatting is left entirely to Prettier.
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "convex/_generated/**",
    "playwright-report/**",
    "test-results/**",
  ]),
]);

export default eslintConfig;

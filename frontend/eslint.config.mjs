import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-stale-*/**",
    "out/**",
    "build/**",
    "playwright-report/**",
    "test-results/**",
    "playwright/.auth/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;

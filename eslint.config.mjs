import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Throwaway working dir: raw captures, probe scripts, and — because a
    // headless Chrome run will happily drop a whole browser profile in here —
    // bundled extension JS that would otherwise dominate the lint output.
    ".scratch/**",
  ]),
]);

export default eslintConfig;

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import reactHooks from "eslint-plugin-react-hooks";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    // This is a large pre-existing codebase that was never actually linted in
    // CI (the `next lint` command was removed entirely in Next.js 16, and the
    // version of eslint-plugin-react bundled by eslint-config-next crashed
    // outright under ESLint 10 before this fix). Now that lint actually runs,
    // a backlog of pre-existing issues surfaces across the repo for the first
    // time. Downgrading these rules to warnings keeps `pnpm lint` from hard
    // failing CI on pre-existing code while still surfacing everything for
    // gradual cleanup. Tighten back to "error" as the backlog is cleared.
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-require-imports": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/error-boundaries": "warn",
      "react-hooks/purity": "warn",
    },
  },
]);

export default eslintConfig;

import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    ".next-verify/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.js",
    // Screenshot-profiler scratch dirs + local helper scripts (not source).
    ".shotprof_*/**",
    "verify-ui.js",
    "_*.tmp",
    "docs/screenshots/**",
  ]),
  {
    plugins: {
      "unused-imports": unusedImports,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      // Auto-remove unused imports
      "unused-imports/no-unused-imports": "warn",
      "unused-imports/no-unused-vars": [
        "warn",
        {
          vars: "all",
          varsIgnorePattern: "^_",
          args: "after-used",
          argsIgnorePattern: "^_",
        },
      ],

      // Auto-sort imports: external → @/ → relative
      "simple-import-sort/imports": [
        "warn",
        {
          groups: [
            // Side effect imports (e.g., CSS)
            ["^\\u0000"],
            // Node.js builtins
            ["^node:"],
            // React and Next.js
            ["^react", "^next"],
            // External packages
            ["^@?\\w"],
            // Internal packages (@/ alias)
            ["^@/"],
            // Parent imports (..)
            ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
            // Same-folder imports (./)
            ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
          ],
        },
      ],
      "simple-import-sort/exports": "warn",

      // Advisory max lines per file
      "max-lines": [
        "warn",
        {
          max: 800,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      // No console except warn/error
      "no-console": [
        "warn",
        {
          allow: ["warn", "error"],
        },
      ],

      // ── Severity policy (see docs/PROJECT-LOG.md) ──────────────────────────
      // `react-hooks/rules-of-hooks` stays an ERROR (inherited from
      // eslint-config-next): it catches real crashes (conditional hook calls).
      // The React-Compiler advisory rules + a pre-existing style/type backlog are
      // kept VISIBLE as warnings during migration so CI can be blocking on errors
      // without drowning in the backlog. Burn these down over time, then re-promote.
      "react-hooks/refs": "warn",
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/static-components": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
      "react/no-unescaped-entities": "warn",
      "react/display-name": "warn",
    },
  },
]);

export default eslintConfig;

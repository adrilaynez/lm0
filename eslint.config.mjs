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
    "out/**",
    "build/**",
    "next-env.d.ts",
    "*.js",
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
    },
  },
]);

export default eslintConfig;

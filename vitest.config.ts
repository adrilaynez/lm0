import path from "node:path";

import { defineConfig } from "vitest/config";

// Node-environment test runner for the i18n parity + MDX content tests.
// These tests import plain TS dictionaries / read files from disk — no DOM needed.
export default defineConfig({
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
    test: {
        environment: "node",
        include: ["src/**/*.test.ts"],
    },
});

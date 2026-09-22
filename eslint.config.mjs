import { createRequire } from "node:module";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";

const require = createRequire(import.meta.url);
const compat = new FlatCompat({
  baseDirectory: dirname(fileURLToPath(import.meta.url)),
  resolvePluginsRelativeTo: dirname(require.resolve("eslint-config-next/package.json")),
});

const config = [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "coverage/**", "out/**", "build/**"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript", "prettier"),
  {
    rules: {
      // CLAUDE.md: no `any`, no non-null assertion without a comment justifying it.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      eqeqeq: ["error", "always"],
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },
  {
    // CLI entry points. Printing a result table IS their output, not a stray log.
    files: ["scripts/**/*.ts", "scripts/**/*.mjs", "src/db/seed.ts", "drizzle.config.ts"],
    rules: { "no-console": "off" },
  },
];

export default config;

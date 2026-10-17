import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const config = [
  {
    ignores: [
      ".next/**",
      ".next-production/**",
      ".next-*/**",
      "node_modules/**",
      "next-env.d.ts",
      "coverage/**",
      "out/**",
      "build/**",
      "test-results/**",
      "playwright-report/**",
    ],
  },
  ...nextVitals,
  ...nextTypescript,
  prettier,
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

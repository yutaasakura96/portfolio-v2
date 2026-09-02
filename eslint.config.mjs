import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Non-project files that happen to live in the repo
    ".agents/**",
    "coverage/**",
    "generated/**",
  ]),
  {
    // The ISR cache handler must be plain CommonJS: Next `import()`s it from
    // disk at runtime, outside the bundler, so ESM syntax and `@/*` aliases are
    // unavailable there. Scoped to this one file rather than disabling the rule
    // project-wide. See cache-handler.js.
    files: ["cache-handler.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;

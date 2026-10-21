import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const antdBarrelMessage =
  "Import from '@/components/ui' (see docs/10-ARQUITETURA-FRONTEND.md §4).";

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
  ]),
  {
    files: ["app/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    ignores: ["app/providers.tsx", "lib/theme/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "antd",
              message: antdBarrelMessage,
            },
          ],
          patterns: [
            {
              group: ["antd/*"],
              message: antdBarrelMessage,
            },
          ],
        },
      ],
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
]);

export default eslintConfig;

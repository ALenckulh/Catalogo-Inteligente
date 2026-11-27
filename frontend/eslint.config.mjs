import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const antdBarrelMessage =
  "Import from '@/components/ui' (see docs/10-ARQUITETURA-FRONTEND.md §4).";

// Cor só por token (docs/09 §2): var(--...) ou palette/text de lib/theme/tokens.
const COR = "(#([0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})(?![0-9a-zA-Z-])|(rgb|hsl)a?\\(\\s*[0-9])";
const corLiteral = [`Literal[value=/${COR}/]`, `TemplateElement[value.raw=/${COR}/]`].map((selector) => ({
  selector,
  message: "Cor literal: use var(--...) ou lib/theme/tokens (docs/09 §2).",
}));

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
    files: ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}", "lib/**/*.{ts,tsx}"],
    ignores: ["lib/theme/**"],
    rules: {
      "no-restricted-syntax": ["error", ...corLiteral],
    },
  },
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

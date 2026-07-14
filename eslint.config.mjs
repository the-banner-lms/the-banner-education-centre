import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    files: ["src/**/*.{ts,tsx}"],
    rules: {
      // Supabase joins and editor plugins expose dynamic payloads without generated DB types.
      "@typescript-eslint/no-explicit-any": "off",
      // User-uploaded Supabase/avatar URLs are intentionally rendered without Next host allowlists.
      "@next/next/no-img-element": "off",
      // Attendance forms intentionally synchronize editable state from server-provided records.
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // One-off database/debug utilities are not part of the production app.
    "*.js",
    "check-schema.ts",
    "seed-team.ts",
  ]),
]);

export default eslintConfig;

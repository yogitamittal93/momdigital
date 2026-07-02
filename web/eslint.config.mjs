import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

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
    // Generated mobile/web bundle artifacts checked into android assets.
    "android/app/src/main/assets/public/**",
    // Generated Capacitor iOS bundle artifacts.
    "ios/App/App/public/**",
  ]),
]);

export default eslintConfig;

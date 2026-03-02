import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "references/**",
    ".sisyphus/**",
  ]),
  {
    rules: {
      "no-console": "off", // Allow console.log usage
      "no-debugger": "warn", // Warn on debugger statements
      "react/jsx-key": "off",
      "react/prop-types": "off",
      "import/order": "off",
    },
  },
  {
    files: ["server.js", "server/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;

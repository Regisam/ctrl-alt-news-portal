// CTRL + ALT News — ESLint Configuration (Flat Config, ESLint 10+)
// Covers: TypeScript, React Hooks, and jsx-a11y accessibility rules
// Note: eslint-plugin-react v7 has a known compat issue with ESLint 10 flat config,
//       so we use typescript-eslint + react-hooks + jsx-a11y directly.

import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";

export default tseslint.config(
  // Base JS recommended rules
  js.configs.recommended,

  // TypeScript recommended rules
  ...tseslint.configs.recommended,

  // React Hooks + jsx-a11y
  {
    files: ["client/src/**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "jsx-a11y": jsxA11y,
    },
    rules: {
      // ---- React Hooks ----
      ...reactHooks.configs.recommended.rules,

      // ---- Accessibility (jsx-a11y) ----
      ...jsxA11y.configs.recommended.rules,
      "jsx-a11y/no-autofocus": "warn",         // Warn instead of error for search autofocus
      "jsx-a11y/click-events-have-key-events": "warn",
      "jsx-a11y/no-static-element-interactions": "warn",

      // ---- TypeScript ----
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],

      // ---- General Quality ----
      "no-console": ["warn", { allow: ["warn", "error"] }],
    },
  },

  // Ignore patterns
  {
    ignores: [
      "dist/**",
      "node_modules/**",
      "vite.config.ts",
      "eslint.config.js",
      "patches/**",
      // Template/vendor files — not authored code
      "client/src/components/ui/**",
      "client/src/components/ManusDialog.tsx",
      "client/src/components/ErrorBoundary.tsx",
    ],
  }
);

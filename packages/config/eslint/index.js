import js from "@eslint/js"
import tsParser from "@typescript-eslint/parser"
import tsPlugin from "@typescript-eslint/eslint-plugin"
import globals from "globals"

const tsBlock = {
  files: ["**/*.{ts,tsx}"],
  languageOptions: {
    parser: tsParser,
    parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  },
  plugins: { "@typescript-eslint": tsPlugin },
  rules: {
    ...tsPlugin.configs.recommended.rules,
    "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "error",
  },
}

const ignoreBlock = {
  ignores: ["node_modules/**", ".next/**", "dist/**", ".turbo/**"],
}

/** Base config — no environment globals */
export const base = [js.configs.recommended, tsBlock, ignoreBlock]

/** Browser / React packages */
export const browser = [
  js.configs.recommended,
  {
    ...tsBlock,
    languageOptions: {
      ...tsBlock.languageOptions,
      globals: { ...globals.browser },
      parserOptions: { ...tsBlock.languageOptions.parserOptions, ecmaFeatures: { jsx: true } },
    },
  },
  ignoreBlock,
]

/** Node.js packages */
export const node = [
  js.configs.recommended,
  {
    ...tsBlock,
    languageOptions: {
      ...tsBlock.languageOptions,
      globals: { ...globals.node },
    },
  },
  ignoreBlock,
]

/* eslint-env node */
module.exports = {
  root: true,
  ignorePatterns: ["dist", "build", "node_modules", "*.config.js", "*.config.cjs"],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: "module",
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-type-checked",
    "prettier",
  ],
  rules: {
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "@typescript-eslint/no-misused-promises": [
      "error",
      { checksVoidReturn: { attributes: false } },
    ],
  },
  overrides: [
    {
      files: ["packages/web/**/*.{ts,tsx}"],
      parserOptions: {
        project: "./packages/web/tsconfig.app.json",
        tsconfigRootDir: __dirname,
      },
    },
    {
      files: ["packages/api/**/*.ts"],
      parserOptions: {
        project: "./packages/api/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    {
      files: ["packages/shared/**/*.ts"],
      parserOptions: {
        project: "./packages/shared/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
    {
      files: ["packages/mobile/**/*.ts"],
      parserOptions: {
        project: "./packages/mobile/tsconfig.json",
        tsconfigRootDir: __dirname,
      },
    },
  ],
};


## Lint and Type-check Fixes (2025-03-02)
- **Issue**: `npm run lint` failed because `eslint.config.mjs` referenced `react/*` and `import/*` rules, but the corresponding plugins were not installed in this lite template.
- **Issue**: `npm run type-check` failed because it was attempting to type-check the `references/` directory, which contains external code with missing dependencies.
- **Fix**: 
  - Updated `eslint.config.mjs` to exclude `references/**` and `.sisyphus/**` via `globalIgnores`.
  - Removed offending rules (`react/*`, `import/*`) from `eslint.config.mjs`.
  - Updated `tsconfig.json` to exclude the `references` directory.
- **Result**: Both `npm run lint` and `npm run type-check` now pass successfully.

## ESLint and TypeScript Configuration Fixes
- Excluded `references/` and `references/**` from `tsconfig.json` to prevent type-checking of vendored reference repositories.
- Updated `globalIgnores` in `eslint.config.mjs` to include `references/**` and `.sisyphus/**`.
- Disabled ESLint rules `react/jsx-key`, `react/prop-types`, and `import/order` in `eslint.config.mjs` because they were causing issues with missing plugins or incorrect configurations in the flat config setup.
- Added `references` to `.prettierignore` to skip formatting for reference files.

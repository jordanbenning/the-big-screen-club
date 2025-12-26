import rootConfig from '../eslint.config.mjs';

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  ...rootConfig,
  {
    ignores: ['**/*.test.ts', '**/__tests__/**'],
  },
  {
    files: ['**/*.{ts,js}'],
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: import.meta.dirname,
      },
      globals: {
        // Node.js globals are already in the root config
      },
    },
    rules: {
      // Backend-specific rules
      'no-console': 'off', // Console is fine in backend
      '@typescript-eslint/no-var-requires': 'off', // Sometimes needed in Node.js
    },
  },
];

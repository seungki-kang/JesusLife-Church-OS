// ESLint flat config for the active church-core service.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'node_modules/**', '.evidence/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: { ecmaVersion: 2023, sourceType: 'module' },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      // Existing `any` in src is a ratchet: CI allows at most the current count (see package.json
      // lint script --max-warnings). Remove them as code is touched; never add new ones.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    // Test fakes and the integration harness stand in for pg/Fastify objects.
    files: ['test/**/*.ts', 'integration/**/*.ts'],
    rules: { '@typescript-eslint/no-explicit-any': 'off' },
  },
  {
    files: ['**/*.mjs'],
    languageOptions: { globals: { console: 'readonly', process: 'readonly', fetch: 'readonly' } },
  },
);

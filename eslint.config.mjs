import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    files: ['**/*.{ts,tsx}'],
    extends: [eslint.configs.recommended, ...tseslint.configs.recommended],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-console': ['warn', { allow: ['warn', 'error', 'info'] }],
      // Allow require for assets (React Native convention)
      '@typescript-eslint/no-require-imports': 'off',
      // Allow `any` but warn on it (code quality, not blocking)
      '@typescript-eslint/no-explicit-any': 'warn',
      // Allow empty object types (needed for Supabase types)
      '@typescript-eslint/no-empty-object-type': 'off',
      // Allow empty blocks (useful for catch blocks)
      'no-empty': 'off',
    },
  },
  {
    ignores: [
      'node_modules/',
      'dist/',
      'build/',
      '.expo/',
      'coverage/',
      'jest.config.js',
      'babel.config.js',
      'metro.config.js',
      '__tests__/',
    ],
  },
);

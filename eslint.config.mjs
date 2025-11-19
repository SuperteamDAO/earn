import nextConfig from 'eslint-config-next';
import prettier from 'eslint-config-prettier';
import prettierPlugin from 'eslint-plugin-prettier';
import prettierRecommended from 'eslint-plugin-prettier/recommended';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import tseslint from 'typescript-eslint';
import unusedImports from 'eslint-plugin-unused-imports';
import validateJsxNesting from 'eslint-plugin-validate-jsx-nesting';
import tanstackQuery from '@tanstack/eslint-plugin-query';

export default tseslint.config(
  // Ignore patterns (replaces .eslintignore)
  {
    ignores: [
      'node_modules/**',
      'out/**',
      'public/**/*',
      '**/__next_data_cache_handler.js',
      '**/*.cache.js',
      'pnpm-lock.yaml',
      'src/generated/**',
      'next-env.d.ts',
      '.next/**',
      '/.next/**',
      'src/components/icons/**/*.tsx',
    ],
  },

  // Base configs (equivalent to extends in .eslintrc.json)
  // "next/core-web-vitals" - included in nextConfig
  // "plugin:@typescript-eslint/recommended" - tseslint.configs.recommended
  // "plugin:@tanstack/eslint-plugin-query/recommended" - included via tanstackQuery plugin rules
  // "plugin:prettier/recommended" - prettier config
  ...tseslint.configs.recommended,
  ...nextConfig,
  prettier,
  prettierRecommended,

  // Global rules (from top-level "rules" in .eslintrc.json)
  {
    plugins: {
      '@tanstack/query': tanstackQuery,
      'validate-jsx-nesting': validateJsxNesting,
    },
    rules: {
      '@tanstack/query/exhaustive-deps': 'error',
      '@tanstack/query/no-rest-destructuring': 'error',
      '@tanstack/query/stable-query-client': 'error',
      'validate-jsx-nesting/no-invalid-jsx-nesting': 'error',
    },
  },

  // TypeScript/TSX specific overrides (from "overrides" in .eslintrc.json)
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      'unused-imports': unusedImports,
      'simple-import-sort': simpleImportSort,
      prettier: prettierPlugin,
    },
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      'import/no-duplicates': ['error', { 'prefer-inline': true }],
      'react-hooks/exhaustive-deps': 'off', // Incorrectly report needed dependency with Next.js router
      '@next/next/no-img-element': 'off', // We currently not using next/image because it isn't supported with SSG mode
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'inline-type-imports',
        },
      ],
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^\\u0000', '^@?\\w'],
            [
              '^(@(?!/features)|@/lib|@/utils|@/hooks|@/components|@/interface|@/layouts|@/constants)(/.*|$)',
            ],
            ['^@/features/([^/]+)(?=/).*$'],
            ['^\\.'],
            ['^.+\\.s?css$'],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { caughtErrors: 'none' }],
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
);

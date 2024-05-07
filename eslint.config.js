// eslint.config.js

import { promises as fs } from 'node:fs';

import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';

const ignores = (await fs.readFile('.gitignore', 'utf-8')).split('\n').filter((path) => path.trim() !== '');

export default [
  { ignores },
  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  eslint.configs.all,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  ...tseslint.configs.strict,
  prettier,
  {
    languageOptions: {
      parserOptions: {
        project: './tsconfig.json',
      },
    },
    rules: {
      '@typescript-eslint/non-nullable-type-assertion-style': 'error',
      'capitalized-comments': 'off',
      'one-var': 'off',
      'func-names': 'off',
      'sort-keys': 'off',
      'sort-imports': 'off',
      'max-lines': [
        'error',
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],
      'func-style': [
        'error',
        'declaration',
        {
          allowArrowFunctions: true,
        },
      ],
      'no-magic-numbers': [
        'error',
        {
          ignore: [0, 1, 2],
        },
      ],
      'no-undefined': 'off',
      'no-ternary': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/non-nullable-type-assertion-style': 'off',
      '@typescript-eslint/ban-types': 'off',
      '@typescript-eslint/require-await': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/consistent-indexed-object-style': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      'line-comment-position': 'off',
      'no-fallthrough': 'off',
      'no-inline-comments': 'off',
      'no-param-reassign': 'off',
      'id-length': 'off',
      'no-magic-numbers': 'off',
      'no-duplicate-imports': 'off',
      'symbol-description': 'off',
      'no-invalid-this': 'off',
      'max-lines-per-function': 'off',
      'max-lines': 'off',
      'max-statements': 'off',
      'no-await-in-loop': 'off',
    },
  },
];

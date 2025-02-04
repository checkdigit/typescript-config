/*
 * Copyright (c) 2021-2024 Check Digit, LLC
 *
 * This code is licensed under the MIT license (see LICENSE.txt for details).
 */

import { promises as fs } from 'node:fs';

import ts from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';
import jest from 'eslint-plugin-jest';
import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import json from '@eslint/json';
import markdown from '@eslint/markdown';
import yaml from 'eslint-plugin-yml';

const ignores = [
  ...(await fs.readFile('.gitignore', 'utf-8')).split('\n').filter((path) => path.trim() !== ''),
  'eslint.config.mjs',
];

const tsConfigurations = [
  js.configs.all,
  ...ts.configs.strictTypeChecked,
  ...ts.configs.stylisticTypeChecked,
  prettier,
  {
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        projectService: true,
      },
    },
    settings: {
      'import/resolver': {
        typescript: true,
        node: true,
      },
    },
    rules: {
      'no-shadow': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'error',
      '@typescript-eslint/no-shadow': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
        },
      ],

      'no-underscore-dangle': 'off',
      'no-useless-constructor': 'off',
      '@typescript-eslint/no-useless-constructor': ['error'],
      'func-names': 'off',

      // Per require-await docs:
      // If you are throwing an error inside an asynchronous function for this purpose, then you may want to disable this rule.
      'require-await': 'off',
      '@typescript-eslint/require-await': 'off',

      // enforce use of curly braces around if statements and discourage one-line ifs
      curly: 'error',

      // undefined can be used
      'no-undefined': 'off',

      'sort-imports': [
        'error',
        {
          ignoreCase: true,
          ignoreDeclarationSort: true,
        },
      ],

      'spaced-comment': 'error',
      'no-var': 'error',
      'prefer-const': 'error',
      'prefer-rest-params': 'error',
      'prefer-spread': 'error',
      'require-yield': 'error',
      'no-console': 'error',
      'no-return-await': 'error',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-require-imports': 'error',

      // sometimes fails on valid interface names like ISO8583
      '@typescript-eslint/interface-name-prefix': 'off',

      // typeof any === "evil".
      '@typescript-eslint/no-explicit-any': 'error',

      // eslint:all rules to modify
      'one-var': 'off',
      'default-case': 'off',
      'sort-keys': 'off',
      'capitalized-comments': 'off',

      'func-style': [
        'error',
        'declaration',
        {
          allowArrowFunctions: true,
        },
      ],

      'multiline-comment-style': 'off',

      'no-magic-numbers': [
        'error',
        {
          ignore: [
            -1,
            0,
            1,
            2,
            4,
            7,
            8,
            10,
            12,
            16,
            24,
            30,
            31,
            32,
            60,
            64,
            128,
            256,
            512,
            1000,
            1024,
            2048,
            4096,
            8192,
            16_384,
            32_768,
            65_536,
            '-1n',
            '0n',
            '1n',
            '2n',
            '4n',
            '7n',
            '8n',
            '10n',
            '12n',
            '16n',
            '24n',
            '30n',
            '31n',
            '32n',
            '60n',
            '64n',
            '128n',
            '256n',
            '512n',
            '1000n',
            '1024n',
            '2048n',
            '4096n',
            '8192n',
            '16384n',
            '32768n',
            '65536n',
          ],
        },
      ],

      'no-ternary': 'off',

      // this should use the default (3) but would currently cause too much pain
      'max-params': ['error', 8],

      // this should be turned on if the ignoreTopLevelFunctions option starts working
      'max-statements': 'off',
      'consistent-return': 'off',
      'init-declarations': 'off',
      'no-inline-comments': 'off',
      'line-comment-position': 'off',
      'prefer-destructuring': 'off',

      // thanks to Prettier, we don't rely on automatic semicolon insertion, so this can remain off
      'no-plusplus': 'off',

      'max-lines': [
        'error',
        {
          max: 500,
          skipBlankLines: true,
          skipComments: true,
        },
      ],

      'id-length': 'off',

      'new-cap': [
        'error',
        {
          capIsNew: false,
        },
      ],

      'dot-notation': 'off',

      // having this restriction for number/boolean literals forces unnecessary changes
      '@typescript-eslint/restrict-template-expressions': [
        'error',
        {
          allowNumber: true,
          allowBoolean: true,
        },
      ],

      // we are seriously using many new features such as fetch, etc.
      'n/no-unsupported-features/node-builtins': 'off',
    },
  },
  {
    files: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      '@typescript-eslint/no-base-to-string': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-non-null-asserted-optional-chain': 'off',
      '@typescript-eslint/no-confusing-void-expression': 'off',
      '@typescript-eslint/strict-boolean-expressions': 'off',
      '@typescript-eslint/unbound-method': 'off',
      '@typescript-eslint/no-floating-promises': [
        'error',
        {
          allowForKnownSafeCalls: [
            {
              from: 'package',
              name: [
                'after',
                'afterEach',
                'before',
                'beforeEach',
                'describe',
                'describe.only',
                'describe.skip',
                'describe.todo',
                'it',
                'it.only',
                'it.skip',
                'it.todo',
                'suite',
                'suite.only',
                'suite.skip',
                'suite.todo',
                'test',
                'test.only',
                'test.skip',
                'test.todo',
              ],
              package: 'node:test',
            },
          ],
        },
      ],
      'import/no-extraneous-dependencies': 'off',
      'n/no-process-env': 'off',
      'max-lines': 'off',
      'max-lines-per-function': 'off',
      'max-statements': 'off',
      'no-await-in-loop': 'off',
      'no-magic-numbers': 'off',
      'no-undefined': 'off',
      'prefer-promise-reject-errors': 'off',
      'require-yield': 'off',
    },
  },
  {
    files: ['**/*.spec.ts'],
    ...jest.configs['flat/recommended'],
    rules: {
      ...jest.configs['flat/recommended'].rules,
      'jest/expect-expect': 'off',
      'jest/no-deprecated-functions': 'off',
      'jest/max-nested-describe': [
        'error',
        {
          max: 1,
        },
      ],
      'jest/no-duplicate-hooks': ['error'],
      'jest/prefer-hooks-in-order': ['error'],
      'jest/prefer-hooks-on-top': ['error'],
      'jest/no-disabled-tests': ['error'],
      'jest/no-commented-out-tests': ['error'],
      'jest/require-top-level-describe': [
        'error',
        {
          maxNumberOfTopLevelDescribes: 1,
        },
      ],
    },
  },
  {
    files: ['src/test/**/*.ts'],
    rules: {
      'no-constant-condition': 'off',
      'no-constant-binary-expression': 'off',
      'no-param-reassign': 'off',
      'no-useless-return': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-parameters': 'off',
    },
  },
].map((config) => ({
  ...config,
  files: config.files ?? ['**/*.ts'],
}));

const jsonConfigurations = [
  {
    ignores: ['package-lock.json'],
    language: 'json/json',
    ...json.configs.recommended,
  },
].map((config) => ({
  ...config,
  files: config.files ?? ['**/*.json'],
}));

const yamlConfigurations = yaml.configs['flat/recommended'].map((config) => ({
  ...config,
  files: config.files ?? ['**/*.yml', '**/*.yaml'],
}));

const markdownConfigurations = markdown.configs.recommended.map((config) => ({
  ...config,
  files: config.files ?? ['**/*.md'],
}));

export default [
  { ignores },
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
  },
  ...tsConfigurations,
  ...markdownConfigurations,
  ...jsonConfigurations,
  ...yamlConfigurations,
];

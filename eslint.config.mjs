import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import pluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import nodePlugin from 'eslint-plugin-n';

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    name: 'ignore files',
    ignores: ['dist/', 'build/', 'reports/', 'node_modules/']
  },
  {
    name: 'include files',
    files: ['**/*.{js,mjs,cjs,ts}']
  },
  {
    name: 'globals for node',
    files: ['**/*.{mjs,cjs,ts}'],
    languageOptions: { globals: globals.node }
  },
  {
    ...pluginJs.configs.recommended,
    name: 'plugin-js recommended'
  },
  {
    ...nodePlugin.configs['flat/recommended-module'],
    name: 'custom eslint-plugin-n plugin config',
    files: ['**/*.ts'],
    rules: {
      'n/no-process-env': 'error',
      'n/no-missing-import': [
        'off', // eslint-plugin-n fails to resolve index.ts files
        {
          tryExtensions: ['.ts', '.d.ts']
        }
      ]
    },
    languageOptions: {
      globals: {
        ...globals.node,
        NodeJS: true
      }
    }
  },
  {
    ...nodePlugin.configs['flat/recommended-module'],
    name: 'custom eslint-plugin-n plugin config for tests',
    files: ['tests*/**/*.ts'],
    // eslint-plugin-n rules
    rules: {
      'n/no-process-env': 'off'
    },
    languageOptions: {
      globals: {
        ...globals.jest
      }
    }
  },
  ...tseslint.configs.recommended.map(config => ({
    ...config,
    files: ['**/*.ts'],
    rules: {
      'no-unused-vars': 'off',
      'no-redeclare': 'off',
      '@typescript-eslint/no-redeclare': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_'
        }
      ]
    }
  })),
  {
    // eslint core rules
    rules: {
      complexity: ['error', 10],
      'no-console': 'error',
      eqeqeq: ['error', 'smart']
    }
  },
  pluginPrettierRecommended
];

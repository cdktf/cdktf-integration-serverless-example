/**
 * Copyright (c) HashiCorp, Inc.
 * SPDX-License-Identifier: MPL-2.0
 */

const eslint = require('@eslint/js');
const importPlugin = require('eslint-plugin-import');
const eslintPluginReact = require('eslint-plugin-react');
const tseslint = require('typescript-eslint');

// @source https://gist.github.com/cmdcolin/22c4b3bbf8a32d0ff530fde12453d129
module.exports = tseslint.config(
  {
    // might be able to find a way to not ignore some of these but i just ignore them
    ignores: [
      '**/build',
      'tailwind.config.js',
      'eslint.config.js',
      'postcss.config.js'
    ],
  },
  {
    languageOptions: {
      parserOptions: {
        project: ['../tsconfig.json'],
        tsconfigRootDir: __dirname,
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.stylisticTypeChecked,
  ...tseslint.configs.strictTypeChecked, // <-- most important line, max strictness. if any of th rules don't work for your codebase as being too strict, disable them one by one, but it is worth trying to crank up strictness to max
  importPlugin.flatConfigs.recommended,
  eslintPluginReact.configs.flat.recommended,
  {
    rules: {
      // allow console.warn and console.error, but not console.log. personal pref
      'no-console': [
        'warn',
        {
          allow: ['error', 'warn'],
        },
      ],

      // force use of curly brackts on if statements
      curly: 'error',
      
      // force space after comments
      'spaced-comment': [
        'error',
        'always',
        {
          markers: ['/'],
        },
      ],

      // prefer template strings over string appends
      'prefer-template': 'error',

      // if you use 'new jsx transform' don't have to import React from 'react'
      'react/react-in-jsx-scope': 'off',

      // take it or leave it, it sorts and organizes import statements
      // there might be other ways but this prevents me from manually fiddling with order
      'import/no-unresolved': 'off',
      'import/order': [
        'error',
        {
          named: true,
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
          },
          groups: [
            'builtin',
            ['external', 'internal'],
            ['parent', 'sibling', 'index', 'object'],
            'type',
          ],
          pathGroups: [
            {
              group: 'builtin',
              pattern: 'react',
              position: 'before',
            },
            {
              group: 'external',
              pattern: '@mui/icons-material',
              position: 'after',
            },
          ],

          pathGroupsExcludedImportTypes: ['react'],
        },
      ],
    },
  },
);

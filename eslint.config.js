const nextEslintPlugin = require('@next/eslint-plugin-next');
const reactPlugin = require('eslint-plugin-react');
const typescriptPlugin = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
  {
    files: ['**/*.ts', '**/*.tsx'],
    ignores: ['functions/**'],
    plugins: {
      '@next/next': nextEslintPlugin,
      'react': reactPlugin,
      '@typescript-eslint': typescriptPlugin,
    },
    languageOptions: {
      parser: typescriptParser,
    },
    rules: {
      ...nextEslintPlugin.configs.recommended.rules,
      ...nextEslintPlugin.configs['core-web-vitals'].rules,
      ...reactPlugin.configs.recommended.rules,
      ...typescriptPlugin.configs.recommended.rules,
    },
  },
];

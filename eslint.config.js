import tseslint from '@typescript-eslint/eslint-plugin'
import tsparser from '@typescript-eslint/parser'

export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      'client/public/**',
      'server/logs/**',
      'server/temp/**',
      'server/files/store/**',
      'server/files/store-dev/**',
      'server/files/store-test/**',
      'deployment/**',
      'docs/**',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsparser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        // Let @typescript-eslint discover the appropriate tsconfig.json per file
        // This avoids path resolution issues like attempting to read server/tsconfig.base.json
        projectService: true,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        {
          prefer: 'type-imports',
          fixStyle: 'separate-type-imports',
        },
      ],
    },
  },
]

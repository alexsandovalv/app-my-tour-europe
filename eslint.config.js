import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'dist-single', 'node_modules', 'coverage'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/no-explicit-any': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // La capa de dominio y aplicación no puede conocer React, el DOM ni la infraestructura.
    files: ['src/domain/**', 'src/application/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react-dom/*'],
              message: 'El núcleo no depende de React.',
            },
            {
              group: ['**/infrastructure/**', '**/presentation/**'],
              message: 'Dependencia hacia afuera prohibida (regla de dependencia).',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/domain/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['react', 'react-dom', 'react-dom/*'],
              message: 'El dominio no depende de React.',
            },
            {
              group: ['**/application/**', '**/infrastructure/**', '**/presentation/**'],
              message: 'El dominio no depende de capas externas.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/presentation/**'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/infrastructure/**'],
              message:
                'La presentación usa casos de uso; la infraestructura se inyecta en composition.ts.',
            },
          ],
        },
      ],
    },
  },
)

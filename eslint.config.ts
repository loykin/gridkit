import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      // ── React Hooks (classic rules only) ─────────────────────────────────────
      // React Compiler-specific rules (refs, immutability, set-state-in-effect, etc.)
      // produce false positives for intentional library patterns such as
      // ref-to-latest-value and synchronous state init in useLayoutEffect.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── TypeScript ────────────────────────────────────────────────────────────
      // Disallow `any` — use eslint-disable-next-line where unavoidable (e.g. TanStack internals)
      '@typescript-eslint/no-explicit-any': 'error',

      // Unused variables allowed when prefixed with _ (e.g. TanStack generic params)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    files: ['e2e/**/*.mjs'],
    languageOptions: {
      globals: {
        fetch: 'readonly',
        getComputedStyle: 'readonly',
        localStorage: 'readonly',
        process: 'readonly',
        setTimeout: 'readonly',
      },
    },
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: {
        process: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'playground/**'],
  }
)

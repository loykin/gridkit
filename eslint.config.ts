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
      // React Compiler 전용 규칙(refs, immutability, set-state-in-effect 등)은
      // 라이브러리에서 쓰는 의도적 패턴(ref-to-latest-value, useLayoutEffect 초기 sync)을
      // false positive로 잡으므로 비활성화.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      // ── TypeScript ────────────────────────────────────────────────────────────
      // any 원칙적 금지 — TanStack 내부 필드 접근 등 불가피한 곳엔 disable 주석 사용
      '@typescript-eslint/no-explicit-any': 'error',

      // 미사용 변수 — _ prefix 허용 (TanStack 제네릭 파라미터 등)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**', 'playground/**'],
  }
)

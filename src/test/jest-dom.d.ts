import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'

// jest-dom 7.0.1 still augments the pre-v5 `Assertion<T>` signature
/* eslint-disable @typescript-eslint/no-empty-object-type, @typescript-eslint/no-unused-vars */
declare module 'vitest' {
  interface Assertion<R extends void | Promise<void> = void, T = unknown>
    extends TestingLibraryMatchers<unknown, T> {}
  interface AsymmetricMatchersContaining extends TestingLibraryMatchers<unknown, unknown> {}
}

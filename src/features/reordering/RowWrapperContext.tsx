import { createContext, type ComponentType, type ReactNode } from 'react'

/**
 * Allows variants (e.g. DataGridDrag) to inject a per-row wrapper component
 * without threading props through DataGridShell → DataGridTableView → DataGridFlexBody.
 *
 * DataGridFlexBody reads this context and wraps each row if a wrapper is provided.
 *
 * Wrappers only receive the stable row identifier they need for drag behavior.
 */
export const RowWrapperContext = createContext<
  ComponentType<{ row: { id: string }; children: ReactNode }> | null
>(null)

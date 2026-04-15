import React from 'react'
import type { Row } from '@tanstack/react-table'

/**
 * Allows variants (e.g. DataGridDrag) to inject a per-row wrapper component
 * without threading props through DataGridShell → DataGridTableView → DataGridFlexBody.
 *
 * DataGridFlexBody reads this context and wraps each row if a wrapper is provided.
 *
 * Row<any> is intentional — this context is generic and doesn't care about TData.
 * Row<unknown> is structurally incompatible due to contravariant accessorFn<TData>.
 */
export const RowWrapperContext = React.createContext<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.ComponentType<{ row: Row<any>; children: React.ReactNode }> | null
>(null)

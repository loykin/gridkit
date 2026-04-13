import React from 'react'
import type { Row } from '@tanstack/react-table'

/**
 * Allows variants (e.g. DataGridDrag) to inject a per-row wrapper component
 * without threading props through DataGridShell → DataGridTableView → DataGridFlexBody.
 *
 * DataGridFlexBody reads this context and wraps each row if a wrapper is provided.
 */
export const RowWrapperContext = React.createContext<
  React.ComponentType<{ row: Row<any>; children: React.ReactNode }> | null
>(null)

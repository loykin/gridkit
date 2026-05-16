import type { RowData, TableFeature } from '@tanstack/react-table'
import type React from 'react'

// ── Declaration merging ───────────────────────────────────────────────────────
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * Row action menu items. DataGrid renders a ⋯ trigger button in this
     * column and manages a single shared dropdown at the table level —
     * no per-row dropdown instances, popup survives data refreshes.
     */
    actions?: (row: TData) => Array<{
      label: string
      onClick: (row: TData) => void
      variant?: 'default' | 'destructive'
      disabled?: boolean
      icon?: React.ReactNode
    }>
  }
}

// ── Feature ───────────────────────────────────────────────────────────────────
// Type declaration only for now — table.getRowActions() can be added later.
export const RowActionsFeature: TableFeature = {}

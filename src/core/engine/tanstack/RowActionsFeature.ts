import type { RowData, TableFeatures } from '@/core/engine/tanstack/gridKitTable'
import type React from 'react'

// ── Declaration merging ───────────────────────────────────────────────────────
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, in out TValue> {
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

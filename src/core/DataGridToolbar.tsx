import type React from 'react'
import type { Table } from '@tanstack/react-table'

interface DataGridToolbarProps<T extends object> {
  table: Table<T>
  leftFilters?: (table: Table<T>) => React.ReactNode
  rightFilters?: (table: Table<T>) => React.ReactNode
}

export function DataGridToolbar<T extends object>({
  table,
  leftFilters,
  rightFilters,
}: DataGridToolbarProps<T>) {
  if (!(leftFilters || rightFilters)) {
    return null
  }

  return (
    <div className="flex items-center justify-between gap-2 shrink-0">
      <div className="flex items-center gap-2">{leftFilters?.(table)}</div>
      <div className="flex items-center gap-2">{rightFilters?.(table)}</div>
    </div>
  )
}

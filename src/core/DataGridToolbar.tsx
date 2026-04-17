import type React from 'react'
import type { Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'

interface DataGridToolbarProps<T extends object> {
  table: Table<T>
  leftFilters?: (table: Table<T>) => React.ReactNode
  rightFilters?: (table: Table<T>) => React.ReactNode
  className?: string
}

export function DataGridToolbar<T extends object>({
  table,
  leftFilters,
  rightFilters,
  className,
}: DataGridToolbarProps<T>) {
  if (!(leftFilters || rightFilters)) {
    return null
  }

  return (
    <div className={cn('dg-toolbar', 'flex items-center justify-between gap-2 shrink-0', className)}>
      <div className="flex items-center gap-2">{leftFilters?.(table)}</div>
      <div className="flex items-center gap-2">{rightFilters?.(table)}</div>
    </div>
  )
}

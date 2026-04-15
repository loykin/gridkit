import type React from 'react'
import type { Table, Row } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { DataGridToolbar } from '@/core/DataGridToolbar'
import { DataGridTableView } from '@/core/DataGridTableView'
import type { TableViewConfig } from '@/types'

interface DataGridShellProps<T extends object> extends TableViewConfig<T> {
  wrapperRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  table: Table<T>
  rows: Row<T>[]
  isSized: boolean
  measure: () => void
  error?: Error | null
  leftFilters?: (table: Table<T>) => React.ReactNode
  rightFilters?: (table: Table<T>) => React.ReactNode
  loadMoreRef?: React.RefObject<HTMLDivElement | null>
  isFetchingNextPage?: boolean
  footer?: React.ReactNode
}

export function DataGridShell<T extends object>({
  wrapperRef,
  containerRef,
  table,
  rows,
  isSized,
  measure,
  error,
  leftFilters,
  rightFilters,
  loadMoreRef,
  isFetchingNextPage,
  footer,
  ...viewConfig
}: DataGridShellProps<T>) {
  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-destructive">
        {error.message}
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="flex flex-col gap-3 w-full min-w-0 overflow-hidden">
      <DataGridToolbar table={table} leftFilters={leftFilters} rightFilters={rightFilters} />

      <div className={cn('min-w-0', !isSized && 'invisible')}>
        <DataGridTableView
          table={table}
          rows={rows}
          containerRef={containerRef}
          loadMoreRef={loadMoreRef}
          isFetchingNextPage={isFetchingNextPage}
          onMeasureColumns={measure}
          {...viewConfig}
        />
      </div>

      {footer}
    </div>
  )
}

import type React from 'react'
import type { Table, Row } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { DataGridToolbar } from '@/core/DataGridToolbar'
import { DataGridTableView } from '@/core/DataGridTableView'
import type { GridKitHeaderSlot, TableViewConfig } from '@/types'

interface DataGridShellProps<T extends object> extends TableViewConfig<T> {
  wrapperRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  table: Table<T>
  rows: Row<T>[]
  isSized: boolean
  measure: () => void
  error?: Error | null
  headerLeft?: GridKitHeaderSlot<T>
  headerRight?: GridKitHeaderSlot<T>
  loadMoreRef?: React.RefObject<HTMLDivElement | null>
  isFetchingNextPage?: boolean
  footer?: (table: Table<T>) => React.ReactNode
}

export function DataGridShell<T extends object>({
  wrapperRef,
  containerRef,
  table,
  rows,
  isSized,
  measure,
  error,
  headerLeft,
  headerRight,
  loadMoreRef,
  isFetchingNextPage,
  footer,
  ...viewConfig
}: DataGridShellProps<T>) {
  if (error) {
    return <div className="dg-error">{error.message}</div>
  }

  return (
    <div ref={wrapperRef} className="dg-shell">
      <DataGridToolbar table={table} headerLeft={headerLeft} headerRight={headerRight} />

      <div className={cn('dg-table-wrapper', !isSized && 'dg-table-wrapper--hidden')}>
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

      {footer?.(table)}
    </div>
  )
}

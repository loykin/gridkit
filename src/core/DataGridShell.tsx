import React, { useEffect } from 'react'
import type { Table, Row } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { GridKitShell } from '@/core/GridKitShell'
import { DataGridTableView } from '@/core/views/DataGridTableView'
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
  fillParent?: boolean
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
  fillContainer,
  fillParent,
  ...viewConfig
}: DataGridShellProps<T>) {
  useEffect(() => {
    if (fillParent && fillContainer) {
      console.warn('[GridKit] fillParent and fillContainer were both provided. fillParent takes precedence.')
    }
  }, [fillContainer, fillParent])

  if (error) {
    return <div className="dg-error">{error.message}</div>
  }

  return (
    <GridKitShell
      wrapperRef={wrapperRef}
      table={table}
      headerLeft={headerLeft}
      headerRight={headerRight}
      fillContainer={fillContainer}
      fillParent={fillParent}
      containerClassName={cn('dg-table-wrapper', !isSized && 'dg-table-wrapper--hidden')}
      footer={footer?.(table)}
    >
      <DataGridTableView
        table={table}
        rows={rows}
        containerRef={containerRef}
        loadMoreRef={loadMoreRef}
        isFetchingNextPage={isFetchingNextPage}
        onMeasureColumns={measure}
        fillContainer={fillContainer}
        fillParent={fillParent}
        {...viewConfig}
      />
    </GridKitShell>
  )
}

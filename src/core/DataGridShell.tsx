import React from 'react'
import type { Table, Row } from '@tanstack/react-table'
import { GridKitShell } from '@/core/GridKitShell'
import { GridKitError } from '@/core/GridKitError'
import { DataGridTableView } from '@/core/views/DataGridTableView'
import type { DataGridStyles, GridKitHeaderSlot, TableViewConfig } from '@/types'

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
  styles?: DataGridStyles
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
  classNames,
  styles,
  ...viewConfig
}: DataGridShellProps<T>) {
  return (
    <GridKitShell
      wrapperRef={wrapperRef}
      table={table}
      headerLeft={headerLeft}
      headerRight={headerRight}
      fillContainer={fillContainer}
      fillParent={fillParent}
      frameView="table"
      frameHidden={!isSized}
      classNames={classNames}
      styles={styles}
      footer={footer?.(table)}
    >
      {error
        ? <GridKitError error={error} classNames={classNames} styles={styles} />
        : (
            <DataGridTableView
              table={table}
              rows={rows}
              containerRef={containerRef}
              loadMoreRef={loadMoreRef}
              isFetchingNextPage={isFetchingNextPage}
              onMeasureColumns={measure}
              fillContainer={fillContainer}
              fillParent={fillParent}
              classNames={classNames}
              styles={styles}
              {...viewConfig}
            />
          )}
    </GridKitShell>
  )
}

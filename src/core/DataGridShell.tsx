import React, { useMemo } from 'react'
import type { Table, Row } from '@tanstack/react-table'
import { GridKitShell } from '@/core/GridKitShell'
import { GridKitError } from '@/core/GridKitError'
import { useTableViewMetrics } from '@/core/TableViewMetricsContext'
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
  openBottom,
  classNames,
  styles,
  headerHeight: _headerHeight,
  rowHeight: _rowHeight,
  estimateRowHeight: _estimateRowHeight,
  ...viewConfig
}: DataGridShellProps<T>) {
  const metrics = useTableViewMetrics()
  const shellStyles = useMemo<DataGridStyles>(
    () => ({
      ...styles,
      root: {
        '--gridkit-header-height': `${metrics.headerHeight}px`,
        ...(metrics.rowHeight != null
          ? { '--gridkit-row-height': `${metrics.rowHeight}px` }
          : undefined),
        ...styles?.root,
      } as React.CSSProperties,
    }),
    [metrics.headerHeight, metrics.rowHeight, styles],
  )

  return (
    <GridKitShell
      wrapperRef={wrapperRef}
      table={table}
      headerLeft={headerLeft}
      headerRight={headerRight}
      fillContainer={fillContainer}
      fillParent={fillParent}
      openBottom={openBottom}
      frameView="table"
      frameHidden={!isSized}
      classNames={classNames}
      styles={shellStyles}
      footer={footer?.(table)}
    >
      {error ? (
        <GridKitError error={error} classNames={classNames} styles={styles} />
      ) : (
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

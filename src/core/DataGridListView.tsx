import type React from 'react'
import type { Row, Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { useIcons } from '@/core/IconsContext'
import { GridKitShell } from '@/core/GridKitShell'
import type { DataGridListProps } from '@/types'

interface DataGridListViewProps<T extends object>
  extends Pick<
    DataGridListProps<T>,
    | 'isLoading'
    | 'emptyMessage'
    | 'emptyContent'
    | 'onRowClick'
    | 'rowCursor'
    | 'renderItem'
    | 'itemKey'
    | 'itemGap'
    | 'itemPadding'
    | 'containerHeight'
    | 'tableHeight'
    | 'isFetchingNextPage'
    | 'headerLeft'
    | 'headerRight'
    | 'footer'
    | 'classNames'
  > {
  wrapperRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  table: Table<T>
  rows: Row<T>[]
  loadMoreRef?: React.RefObject<HTMLDivElement | null>
}

export function DataGridListView<T extends object>({
  wrapperRef,
  containerRef,
  table,
  rows,
  headerLeft,
  headerRight,
  footer,
  loadMoreRef,
  isFetchingNextPage,
  isLoading,
  emptyMessage = 'No data',
  emptyContent,
  renderItem,
  itemKey,
  itemGap = 0,
  itemPadding = 0,
  containerHeight,
  tableHeight,
  onRowClick,
  rowCursor,
  classNames,
}: DataGridListViewProps<T>) {
  const icons = useIcons()
  const listStyle: React.CSSProperties = { gap: itemGap, padding: itemPadding }

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="dg-list-items" style={listStyle}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="dg-list-item">
              <div className="dg-loading-pulse" />
            </div>
          ))}
        </div>
      )
    }

    if (rows.length === 0) {
      return (
        <div className={cn('dg-empty', classNames?.empty)}>
          {emptyContent ?? emptyMessage}
        </div>
      )
    }

    return (
      <div className="dg-list-items" style={listStyle}>
        {rows.map((row) => (
          <div
            key={itemKey?.(row) ?? row.id}
            className={cn(
              'dg-list-item',
              rowCursor && onRowClick && 'dg-list-item--clickable',
              classNames?.item,
            )}
            onClick={onRowClick ? () => onRowClick(row.original) : undefined}
          >
            {renderItem(row)}
          </div>
        ))}
      </div>
    )
  }

  return (
    <GridKitShell
      wrapperRef={wrapperRef}
      containerRef={containerRef}
      table={table}
      headerLeft={headerLeft}
      headerRight={headerRight}
      containerHeight={containerHeight}
      tableHeight={tableHeight}
      containerClassName={cn('dg-list-container', classNames?.container)}
      footer={footer}
    >
      {renderContent()}
      {loadMoreRef && (
        <div ref={loadMoreRef} className={cn('dg-list-load-more', classNames?.loadMore)}>
          {isFetchingNextPage && icons.loading}
        </div>
      )}
    </GridKitShell>
  )
}

import type React from 'react'
import type { Row, Table } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
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
    | 'maxTableHeight'
    | 'minTableHeight'
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
  virtual?: boolean
  rowVirtualizer?: Virtualizer<HTMLElement, Element>
  virtualEstimateSize?: number
  virtualInitialHeight?: number
  virtualOverscan?: number
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
  maxTableHeight,
  minTableHeight,
  onRowClick,
  rowCursor,
  classNames,
  virtual,
  rowVirtualizer,
  virtualEstimateSize = 48,
  virtualInitialHeight = 480,
  virtualOverscan = 10,
}: DataGridListViewProps<T>) {
  const icons = useIcons()
  const listStyle = {
    '--dg-list-gap': `${itemGap}px`,
    '--dg-list-padding': `${itemPadding}px`,
  } as React.CSSProperties

  const renderItemWrapper = (
    row: Row<T>,
    style?: React.CSSProperties,
    measureRef?: (node: Element | null) => void,
    dataIndex?: number,
  ) => (
    <div
      key={itemKey?.(row) ?? row.id}
      ref={measureRef}
      data-index={dataIndex}
      className={cn(
        'dg-list-item',
        rowCursor && onRowClick && 'dg-list-item--clickable',
        classNames?.item,
      )}
      style={style}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
    >
      {renderItem(row)}
    </div>
  )

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

    if (virtual && rowVirtualizer) {
      const virtualItems = rowVirtualizer.getVirtualItems()
      const fallbackCount = Math.min(
        rows.length,
        Math.ceil(virtualInitialHeight / virtualEstimateSize) + virtualOverscan,
      )
      const itemEntries = virtualItems.length > 0
        ? virtualItems.map((virtualRow) => ({
            index: virtualRow.index,
            start: virtualRow.start,
            measureRef: rowVirtualizer.measureElement,
          }))
        : Array.from({ length: fallbackCount }, (_, index) => ({
            index,
            start: index * virtualEstimateSize,
            measureRef: rowVirtualizer.measureElement,
          }))

      return (
        <div className="dg-list-items" style={listStyle} data-virtualized="true">
          <div
            className="dg-list-virtual-spacer"
            style={{ height: rowVirtualizer.getTotalSize() || rows.length * virtualEstimateSize }}
          >
            {itemEntries.map((virtualRow) => {
              const row = rows[virtualRow.index]!
              return renderItemWrapper(
                row,
                {
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  transform: `translateY(${virtualRow.start}px)`,
                },
                virtualRow.measureRef,
                virtualRow.index,
              )
            })}
          </div>
        </div>
      )
    }

    return (
      <div className="dg-list-items" style={listStyle}>
        {rows.map((row) => renderItemWrapper(row))}
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
      maxTableHeight={maxTableHeight}
      minTableHeight={minTableHeight}
      containerClassName={cn('dg-list-container', classNames?.container)}
      footerClassName={classNames?.footer}
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

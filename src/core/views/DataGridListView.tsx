import type React from 'react'
import type { Row, Table } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { useIcons } from '@/core/IconsContext'
import { GridKitShell } from '@/core/GridKitShell'
import { useGridKitLabels } from '@/core/LabelsContext'
import { GridKitError } from '@/core/GridKitError'
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
    | 'fillContainer'
    | 'fillParent'
    | 'openBottom'
    | 'error'
    | 'isFetchingNextPage'
    | 'headerLeft'
    | 'headerRight'
    | 'footer'
    | 'classNames'
    | 'styles'
    | 'scrollbar'
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
  error,
  emptyMessage,
  emptyContent,
  renderItem,
  itemKey,
  itemGap = 0,
  itemPadding = 0,
  containerHeight,
  tableHeight,
  maxTableHeight,
  minTableHeight,
  fillContainer,
  fillParent,
  openBottom,
  onRowClick,
  rowCursor,
  classNames,
  styles,
  scrollbar,
  virtual,
  rowVirtualizer,
  virtualEstimateSize = 48,
  virtualInitialHeight = 480,
  virtualOverscan = 10,
}: DataGridListViewProps<T>) {
  const icons = useIcons()
  const labels = useGridKitLabels()
  const effectiveEmptyMessage = emptyMessage ?? labels.noData
  const listStyle = {
    '--gridkit-list-gap': `${itemGap}px`,
    '--gridkit-list-padding': `${itemPadding}px`,
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
        'gridkit-list-item',
        rowCursor && onRowClick && 'gridkit-list-item--clickable',
        classNames?.item,
      )}
      style={{ ...style, ...styles?.item }}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
    >
      {renderItem(row)}
    </div>
  )

  const renderContent = () => {
    if (error) {
      return <GridKitError error={error} classNames={classNames} styles={styles} />
    }

    if (isLoading) {
      return (
        <div className={cn('gridkit-list-items', classNames?.loading)} style={{ ...listStyle, ...styles?.loading }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="gridkit-list-item">
              <div className="gridkit-loading-pulse" />
            </div>
          ))}
        </div>
      )
    }

    if (rows.length === 0) {
      return (
        <div className={cn('gridkit-empty', classNames?.empty)} style={styles?.empty}>
          {emptyContent ?? effectiveEmptyMessage}
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
        <div className={cn('gridkit-list-items', classNames?.content)} style={{ ...listStyle, ...styles?.content }} data-virtualized="true">
          <div
            className="gridkit-list-virtual-spacer"
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
      <div className={cn('gridkit-list-items', classNames?.content)} style={{ ...listStyle, ...styles?.content }}>
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
      fillContainer={fillContainer}
      fillParent={fillParent}
      openBottom={openBottom}
      frameView="list"
      classNames={classNames}
      styles={styles}
      scrollbar={scrollbar}
      footer={footer}
    >
      {renderContent()}
      {!error && loadMoreRef && (
        <div ref={loadMoreRef} className={cn('gridkit-list-load-more', classNames?.loadMore)} style={styles?.loadMore}>
          {isFetchingNextPage && icons.loading}
        </div>
      )}
    </GridKitShell>
  )
}

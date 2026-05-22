import React, { useLayoutEffect, useState } from 'react'
import type { Row, Table } from '@tanstack/react-table'
import { useVirtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { useIcons } from '@/core/IconsContext'
import { GridKitShell } from '@/core/GridKitShell'
import type { DataGridCardProps } from '@/types'

interface DataGridCardViewProps<T extends object>
  extends Pick<
    DataGridCardProps<T>,
    | 'isLoading'
    | 'emptyMessage'
    | 'emptyContent'
    | 'onRowClick'
    | 'rowCursor'
    | 'renderCard'
    | 'cardColumns'
    | 'minCardWidth'
    | 'minColumns'
    | 'isFetchingNextPage'
    | 'headerLeft'
    | 'headerRight'
    | 'footer'
    | 'classNames'
    | 'containerHeight'
    | 'tableHeight'
    | 'maxTableHeight'
    | 'minTableHeight'
    | 'enableVirtualization'
    | 'estimateCardHeight'
    | 'overscan'
  > {
  wrapperRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  table: Table<T>
  rows: Row<T>[]
  loadMoreRef?: React.RefObject<HTMLDivElement | null>
}

function resolveGridColumns(cardColumns?: number, minCardWidth = 240, minColumns = 1): string {
  if (cardColumns != null) return `repeat(${cardColumns}, 1fr)`
  if (minColumns > 1) {
    return `repeat(auto-fill, minmax(min(${minCardWidth}px, calc(100% / ${minColumns})), 1fr))`
  }
  return `repeat(auto-fill, minmax(${minCardWidth}px, 1fr))`
}

export function DataGridCardView<T extends object>({
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
  renderCard,
  cardColumns,
  minCardWidth = 240,
  minColumns = 1,
  onRowClick,
  rowCursor,
  classNames,
  containerHeight,
  tableHeight,
  maxTableHeight,
  minTableHeight,
  enableVirtualization = false,
  estimateCardHeight = 200,
  overscan = 3,
}: DataGridCardViewProps<T>) {
  const icons = useIcons()

  // Track container width to compute column count for row-group virtualization
  const [measuredCols, setMeasuredCols] = useState(cardColumns ?? minColumns)
  useLayoutEffect(() => {
    if (cardColumns != null || !enableVirtualization) return
    const el = containerRef.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const update = () => {
      const width = el.clientWidth
      if (width <= 0) return
      setMeasuredCols(Math.max(minColumns, Math.floor(width / minCardWidth)))
    }
    const ro = new ResizeObserver(update)
    ro.observe(el)
    update()
    return () => ro.disconnect()
  }, [cardColumns, containerRef, enableVirtualization, minCardWidth, minColumns])

  const effectiveCols = cardColumns ?? measuredCols
  const rowGroupCount = Math.ceil(rows.length / effectiveCols)

  const hasFixedHeight =
    (containerHeight != null && containerHeight !== 'auto') ||
    (tableHeight != null && tableHeight !== 'auto') ||
    maxTableHeight != null

  const virtual = enableVirtualization && hasFixedHeight && rows.length > 0

  const virtualizer = useVirtualizer({
    count: rowGroupCount,
    getScrollElement: () => containerRef.current,
    estimateSize: () => estimateCardHeight,
    overscan,
    enabled: virtual,
  })

  const renderCards = () => {
    if (isLoading) {
      const skeletonCount = effectiveCols * 2
      return (
        <div className="dg-card-grid" style={{ gridTemplateColumns: resolveGridColumns(cardColumns, minCardWidth, minColumns) }}>
          {Array.from({ length: skeletonCount }).map((_, i) => (
            <div key={i} className="dg-card">
              <div className="dg-loading-pulse" style={{ height: 200 }} />
            </div>
          ))}
        </div>
      )
    }

    if (rows.length === 0) {
      return (
        <div className="dg-empty-row">
          <div className={cn('dg-empty', classNames?.empty)}>{emptyContent ?? emptyMessage}</div>
        </div>
      )
    }

    if (virtual) {
      const virtualItems = virtualizer.getVirtualItems()
      return (
        <div style={{ position: 'relative', height: virtualizer.getTotalSize() }}>
          {virtualItems.map((vRow) => {
            const startIdx = vRow.index * effectiveCols
            const rowCards = rows.slice(startIdx, startIdx + effectiveCols)
            return (
              <div
                key={vRow.index}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  transform: `translateY(${vRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: `repeat(${effectiveCols}, 1fr)`,
                }}
              >
                {rowCards.map((row) => (
                  <div
                    key={row.id}
                    className={cn('dg-card', rowCursor && onRowClick && 'dg-card--clickable', classNames?.row)}
                    onClick={onRowClick ? () => onRowClick(row.original) : undefined}
                  >
                    {renderCard(row)}
                  </div>
                ))}
              </div>
            )
          })}
        </div>
      )
    }

    return (
      <div className="dg-card-grid" style={{ gridTemplateColumns: resolveGridColumns(cardColumns, minCardWidth, minColumns) }}>
        {rows.map((row) => (
          <div
            key={row.id}
            className={cn('dg-card', rowCursor && onRowClick && 'dg-card--clickable', classNames?.row)}
            onClick={onRowClick ? () => onRowClick(row.original) : undefined}
          >
            {renderCard(row)}
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
      maxTableHeight={maxTableHeight}
      minTableHeight={minTableHeight}
      containerClassName={cn('dg-card-container', classNames?.container)}
      footerClassName={classNames?.footer}
      footer={footer}
    >
      {renderCards()}

      {loadMoreRef && (
        <div ref={loadMoreRef} className={cn('dg-card-load-more', classNames?.loadMore)}>
          {isFetchingNextPage && icons.loading}
        </div>
      )}
    </GridKitShell>
  )
}

import React from 'react'
import type { Row, Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { useIcons } from '@/core/IconsContext'
import { DataGridToolbar } from '@/core/DataGridToolbar'
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
    | 'leftFilters'
    | 'rightFilters'
    | 'classNames'
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
  leftFilters,
  rightFilters,
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
}: DataGridCardViewProps<T>) {
  const icons = useIcons()

  const gridStyle: React.CSSProperties = {
    gridTemplateColumns: resolveGridColumns(cardColumns, minCardWidth, minColumns),
  }

  const renderContent = () => {
    if (isLoading) {
      const skeletonCount = (cardColumns ?? 4) * 2
      return (
        <div className="dg-card-grid" style={gridStyle}>
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
          <div className="dg-empty">{emptyContent ?? emptyMessage}</div>
        </div>
      )
    }

    return (
      <div className="dg-card-grid" style={gridStyle}>
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
    <div ref={wrapperRef} className="dg-shell">
      <DataGridToolbar table={table} leftFilters={leftFilters} rightFilters={rightFilters} />

      <div ref={containerRef} className={cn('dg-card-container', classNames?.container)}>
        {renderContent()}

        {loadMoreRef && (
          <div ref={loadMoreRef} style={{ padding: '8px 0', display: 'flex', justifyContent: 'center' }}>
            {isFetchingNextPage && icons.loading}
          </div>
        )}
      </div>
    </div>
  )
}

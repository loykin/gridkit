import React, { useContext } from 'react'
import type { Column, Row, Table } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import type { DataGridClassNames, TableViewConfig, TableWidthMode } from '@/types'
import { RowWrapperContext } from '@/features/reordering/RowWrapperContext'
import { colStyle } from './tableUtils'
import { DataGridBodyRow } from './DataGridBodyRow'

interface DataGridBodyProps<T extends object>
  extends Pick<
    TableViewConfig<T>,
    'isLoading' | 'emptyMessage' | 'emptyContent' | 'onRowClick' | 'rowCursor' | 'bordered' | 'rowHeight'
  > {
  rows: Row<T>[]
  table: Table<T>
  visibleLeafColumns: Column<T>[]
  rowVirtualizer?: Virtualizer<HTMLDivElement, Element>
  onActionTrigger?: (row: T, el: HTMLElement) => void
  tableWidthMode?: TableWidthMode
  classNames?: DataGridClassNames
}

export function DataGridBody<T extends object>({
  rows,
  table,
  visibleLeafColumns,
  rowVirtualizer,
  isLoading,
  emptyMessage,
  emptyContent,
  onRowClick,
  rowCursor,
  bordered,
  rowHeight,
  onActionTrigger,
  tableWidthMode = 'spacer',
  classNames,
}: DataGridBodyProps<T>) {
  const showSpacer = tableWidthMode === 'spacer'
  const fillLast = tableWidthMode === 'fill-last'
  const RowWrapper = useContext(RowWrapperContext)
  const virtual = !!rowVirtualizer

  if (isLoading) {
    return (
      <div role="rowgroup" style={{ display: 'block' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            role="row"
            key={i}
            className={cn(
              'flex w-full',
              i < 5 && 'border-b border-[var(--dg-border)]',
            )}
            style={{ minHeight: rowHeight }}
          >
            {visibleLeafColumns.map((col, colIdx) => {
              const isLast = colIdx === visibleLeafColumns.length - 1
              return (
                <div
                  role="gridcell"
                  key={col.id}
                  data-col-id={col.id}
                  className={cn(
                    'dg-loading',
                    'flex items-center px-3 py-1',
                    bordered && 'border-r border-[var(--dg-border)]',
                  )}
                  style={{
                    ...colStyle(col),
                    ...(fillLast && isLast && { flex: 1, width: 'auto' }),
                  }}
                >
                  <div className="h-4 w-full animate-pulse rounded bg-[var(--dg-muted)]" />
                </div>
              )
            })}
            {showSpacer && <div role="gridcell" style={{ flex: 1, minWidth: 0, padding: 0 }} />}
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div role="rowgroup" style={{ display: 'block' }}>
        <div role="row" className="flex w-full">
          <div role="gridcell" className="flex-1">
            {emptyContent ?? (
              <div className={cn(
                'dg-empty',
                'py-12 text-center text-sm text-[var(--dg-muted-foreground)]',
              )}>{emptyMessage}</div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const virtualItems = rowVirtualizer?.getVirtualItems() ?? []
  const totalSize = rowVirtualizer?.getTotalSize() ?? 0

  const rowgroupStyle: React.CSSProperties = virtual
    ? { display: 'block', height: totalSize, position: 'relative' }
    : { display: 'block' }

  const rowEntries = virtual
    ? virtualItems.map((vRow) => ({
        row: rows[vRow.index]!,
        index: vRow.index,
        rowStyle: {
          position: 'absolute' as const,
          width: '100%',
          transform: `translateY(${vRow.start}px)`,
        },
        dataIndex: vRow.index,
        measureRef: rowVirtualizer!.measureElement,
      }))
    : rows.map((row, index) => ({
        row,
        index,
        rowStyle: undefined as React.CSSProperties | undefined,
        dataIndex: undefined as number | undefined,
        measureRef: undefined as ((node: Element | null) => void) | undefined,
      }))

  return (
    <>
      <div role="rowgroup" style={rowgroupStyle}>
        {rowEntries.map(({ row, index, rowStyle, dataIndex, measureRef }) => {
          const bodyRow = (
            <DataGridBodyRow
              key={row.id}
              row={row}
              table={table}
              onRowClick={onRowClick}
              rowCursor={rowCursor}
              bordered={bordered}
              rowHeight={rowHeight}
              showSpacer={showSpacer}
              fillLast={fillLast}
              onActionTrigger={onActionTrigger}
              isLastRow={index === rows.length - 1}
              style={rowStyle}
              dataIndex={dataIndex}
              measureRef={measureRef}
              classNames={classNames}
            />
          )
          if (!virtual && RowWrapper) {
            return (
              <RowWrapper key={row.id} row={row}>
                {bodyRow}
              </RowWrapper>
            )
          }
          return <React.Fragment key={row.id}>{bodyRow}</React.Fragment>
        })}
      </div>
      {/* Fill row: expands into remaining space when rows don't fill tableHeight.
          gradient is invisible at height=0 (rows overflow), preventing double border. */}
      {!virtual && (
        <div
          className="flex flex-1"
          style={{
            background:
              'linear-gradient(to bottom, var(--dg-border) 0px, var(--dg-border) 1px, transparent 1px)',
          }}
        >
          {visibleLeafColumns.map((col, colIdx) => {
            const isLast = colIdx === visibleLeafColumns.length - 1
            return (
              <div
                key={col.id}
                className={cn(bordered && 'border-r border-[var(--dg-border)]')}
                style={{
                  ...colStyle(col),
                  ...(fillLast && isLast && { flex: 1, width: 'auto' }),
                }}
              />
            )
          })}
          {showSpacer && <div style={{ flex: 1, minWidth: 0 }} />}
        </div>
      )}
    </>
  )
}

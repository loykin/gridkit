import React from 'react'
import { flexRender, type HeaderGroup, type Table } from '@tanstack/react-table'
import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DataGridClassNames, TableViewConfig, TableWidthMode } from '@/types'
import { colStyle, isPinnedEdge } from './tableUtils'
import { HeaderFilterPopover } from '@/core/filters/HeaderFilterPopover'

interface DataGridHeaderRowProps<T extends object>
  extends Pick<
    TableViewConfig<T>,
    'enableColumnResizing' | 'bordered' | 'enableColumnFilters' | 'filterDisplay'
  > {
  headerGroup: HeaderGroup<T>
  table: Table<T>
  virtual: boolean
  tableWidthMode?: TableWidthMode
  classNames?: DataGridClassNames
}

export function DataGridHeaderRow<T extends object>({
  headerGroup,
  table,
  enableColumnResizing,
  virtual,
  bordered,
  tableWidthMode = 'spacer',
  enableColumnFilters,
  filterDisplay = 'row',
  classNames,
}: DataGridHeaderRowProps<T>) {
  const headers = headerGroup.headers
  return (
    <div
      role="row"
      className={cn(
        'dg-header-row',
        'flex border-b border-[var(--dg-border)]',
      )}
      style={{ width: '100%', height: '36px' }}
    >
      {headers.map((header, idx) => {
        const edge = isPinnedEdge(header.column, table)
        const isLast = idx === headers.length - 1
        const isFillLast = tableWidthMode === 'fill-last' && isLast
        return (
          <div
            role="columnheader"
            key={header.id}
            data-col-id={header.column.id}
            data-sortable={header.column.getCanSort() ? 'true' : undefined}
            data-pinned={edge === 'left-edge' ? 'left' : edge === 'right-edge' ? 'right' : undefined}
            data-bordered={bordered ? 'true' : undefined}
            className={cn(
              'dg-header-cell',
              'relative h-full select-none group',
              header.column.getCanSort() && 'cursor-pointer',
              'px-3 text-xs font-medium bg-[var(--dg-muted)] text-[var(--dg-muted-foreground)]',
              bordered && 'border-r border-[var(--dg-border)]',
              edge === 'left-edge' && 'shadow-[1px_0_0_0_var(--dg-border)]',
              edge === 'right-edge' && 'shadow-[-1px_0_0_0_var(--dg-border)]',
              classNames?.headerCell,
            )}
            style={
              virtual
                ? {
                    display: 'flex',
                    alignItems: 'center',
                    width: isFillLast ? undefined : header.getSize(),
                    ...(isFillLast && { flex: 1, minWidth: header.getSize() }),
                  }
                : {
                    ...colStyle(header.column),
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    ...(isFillLast && { flex: 1, width: 'auto' }),
                  }
            }
            onClick={
              header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined
            }
          >
            <span className="flex items-center gap-1 min-w-0 overflow-hidden flex-1">
              <span className="truncate">
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </span>
              {header.column.getCanSort() && (
                <span className={cn('dg-sort-icon', 'ml-1 shrink-0 inline-flex items-center')}>
                  {header.column.getIsSorted() === 'asc' ? (
                    <ArrowUp className="h-3.5 w-3.5" />
                  ) : header.column.getIsSorted() === 'desc' ? (
                    <ArrowDown className="h-3.5 w-3.5" />
                  ) : (
                    <ArrowUpDown className="h-3.5 w-3.5 opacity-40 group-hover:opacity-100" />
                  )}
                </span>
              )}
            </span>

            {enableColumnFilters && filterDisplay === 'icon' && (
              <HeaderFilterPopover col={header.column} table={table} />
            )}

            {enableColumnResizing && header.column.getCanResize() && (
              <div
                onMouseDown={(e) => {
                  e.stopPropagation()
                  header.getResizeHandler()(e)
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                  header.getResizeHandler()(e)
                }}
                onClick={(e) => e.stopPropagation()}
                className={cn('dg-resize-handle', 'absolute right-0 top-0 h-full w-3 cursor-col-resize select-none touch-none')}
              >
                <div
                  data-resizing={header.column.getIsResizing() ? 'true' : undefined}
                  className={cn(
                    'dg-resize-bar',
                    'absolute right-1.5 top-2 bottom-2 w-px',
                    'rounded-full transition-colors opacity-0 group-hover:opacity-100',
                    header.column.getIsResizing()
                      ? 'opacity-100 bg-[var(--dg-primary)]'
                      : 'bg-[var(--dg-border)] hover:bg-[var(--dg-primary)]',
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
      {!virtual && tableWidthMode === 'spacer' && (
        <div
          role="columnheader"
          style={{ flex: 1, minWidth: 0, padding: 0 }}
          className="bg-[var(--dg-muted)]"
        />
      )}
    </div>
  )
}

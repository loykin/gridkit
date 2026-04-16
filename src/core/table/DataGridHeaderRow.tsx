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
      className="border-b border-border"
      style={{ display: 'flex', width: '100%', height: '36px' }}
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
            className={cn(
              'relative px-3 text-xs font-medium h-full bg-muted',
              'text-muted-foreground whitespace-normal',
              'select-none group',
              header.column.getCanSort() && 'cursor-pointer',
              bordered && 'border-r border-border',
              edge === 'left-edge' && 'shadow-[1px_0_0_0_hsl(var(--border))]',
              edge === 'right-edge' && 'shadow-[-1px_0_0_0_hsl(var(--border))]',
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
                <span className="ml-1 shrink-0">
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
                className="absolute right-0 top-0 h-full w-3 cursor-col-resize select-none touch-none"
              >
                <div
                  className={cn(
                    'absolute right-1.5 top-2 bottom-2 w-px rounded-full transition-colors',
                    'opacity-0 group-hover:opacity-100',
                    header.column.getIsResizing()
                      ? 'opacity-100 bg-primary'
                      : 'bg-border hover:bg-primary',
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
          className="bg-muted"
        />
      )}
    </div>
  )
}

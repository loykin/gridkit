import React from 'react'
import { flexRender, type Row, type Table } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { DataGridClassNames, TableViewConfig, TableWidthMode } from '@/types'
import { colStyle, isPinnedEdge } from './tableUtils'

interface DataGridBodyRowProps<T extends object>
  extends Pick<TableViewConfig<T>, 'onRowClick' | 'rowCursor' | 'bordered'> {
  row: Row<T>
  table: Table<T>
  style?: React.CSSProperties
  dataIndex?: number
  measureRef?: (node: Element | null) => void
  showSpacer?: boolean
  fillLast?: boolean
  rowHeight?: number
  onActionTrigger?: (row: T, el: HTMLElement) => void
  isLastRow?: boolean
  tableWidthMode?: TableWidthMode
  classNames?: DataGridClassNames
}

export function DataGridBodyRow<T extends object>({
  row,
  table,
  onRowClick,
  rowCursor,
  style,
  dataIndex,
  measureRef,
  showSpacer = false,
  fillLast = false,
  bordered = false,
  rowHeight,
  onActionTrigger,
  isLastRow = false,
  classNames,
}: DataGridBodyRowProps<T>) {
  const visibleCells = row.getVisibleCells()
  return (
    <div
      role="row"
      data-index={dataIndex}
      data-last={isLastRow ? 'true' : undefined}
      data-clickable={(onRowClick || rowCursor) ? 'true' : undefined}
      ref={measureRef}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      className={cn(
        'dg-row',
        'flex w-full transition-colors',
        (onRowClick || rowCursor) && 'cursor-pointer',
        !isLastRow && 'border-b border-[var(--dg-border)]',
        (onRowClick || rowCursor)
          ? 'hover:bg-[var(--dg-muted)]/50'
          : 'hover:bg-[var(--dg-muted)]/30',
        classNames?.row,
      )}
      style={{ minHeight: rowHeight, ...style }}
    >
      {visibleCells.map((cell, idx) => {
        const meta = cell.column.columnDef.meta
        const edge = isPinnedEdge(cell.column, table)
        const isLast = idx === visibleCells.length - 1
        const isFillCell = fillLast && isLast
        return (
          <div
            role="gridcell"
            key={cell.id}
            data-col-id={cell.column.id}
            data-align={meta?.align ?? undefined}
            data-wrap={meta?.wrap ? 'true' : undefined}
            data-pinned={edge === 'left-edge' ? 'left' : edge === 'right-edge' ? 'right' : undefined}
            data-bordered={bordered ? 'true' : undefined}
            className={cn(
              'dg-cell',
              'flex items-center overflow-hidden',
              meta?.align === 'right' && 'justify-end',
              meta?.align === 'center' && 'justify-center',
              meta?.wrap && 'items-start whitespace-normal',
              'px-3 py-1 bg-[var(--dg-background)]',
              bordered && 'border-r border-[var(--dg-border)]',
              edge === 'left-edge' && 'shadow-[1px_0_0_0_var(--dg-border)]',
              edge === 'right-edge' && 'shadow-[-1px_0_0_0_var(--dg-border)]',
              classNames?.cell,
            )}
            style={{ ...colStyle(cell.column), ...(isFillCell && { flex: 1, width: 'auto' }) }}
          >
            {meta?.actions != null ? (
              <Button
                variant="ghost"
                size="icon-xs"
                className="h-6 w-6"
                onClick={(e) => {
                  e.stopPropagation()
                  onActionTrigger?.(row.original, e.currentTarget as HTMLElement)
                }}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            ) : (
              flexRender(cell.column.columnDef.cell, cell.getContext())
            )}
          </div>
        )
      })}
      {showSpacer && (
        <div
          role="gridcell"
          style={{ flex: 1, minWidth: 0, padding: 0 }}
          className="bg-[var(--dg-background)]"
        />
      )}
    </div>
  )
}

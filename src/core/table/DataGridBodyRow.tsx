import type { CSSProperties } from 'react'
import type { Row, Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import type { DataGridClassNames, TableViewConfig, TableWidthMode } from '@/types'
import { DataGridBodyCell } from './DataGridBodyCell'

interface DataGridBodyRowProps<T extends object>
  extends Pick<TableViewConfig<T>, 'onRowClick' | 'rowCursor' | 'bordered'> {
  row: Row<T>
  table: Table<T>
  style?: CSSProperties
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
        classNames?.row,
      )}
      style={{ minHeight: rowHeight, ...style }}
    >
      {visibleCells.map((cell, idx) => {
        const isLast = idx === visibleCells.length - 1

        return (
          <DataGridBodyCell
            key={cell.id}
            cell={cell}
            row={row}
            table={table}
            bordered={bordered}
            isFillCell={fillLast && isLast}
            onActionTrigger={onActionTrigger}
            classNames={classNames}
          />
        )
      })}
      {showSpacer && (
        <div
          role="gridcell"
          style={{ flex: 1, minWidth: 0, padding: 0 }}
        />
      )}
    </div>
  )
}

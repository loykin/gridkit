import type { CSSProperties } from 'react'
import type { Row, Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import type { DataGridClassNames, DataGridStyles, TableViewConfig } from '@/types'
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
  visibleColumnIds?: Set<string>
  pinning?: boolean
  rowHeight?: number
  onActionTrigger?: (row: T, el: HTMLElement) => void
  isLastRow?: boolean
  classNames?: DataGridClassNames
  styles?: DataGridStyles
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
  visibleColumnIds,
  pinning = true,
  bordered = false,
  rowHeight,
  onActionTrigger,
  isLastRow = false,
  classNames,
  styles,
}: DataGridBodyRowProps<T>) {
  const visibleCells = visibleColumnIds
    ? row.getVisibleCells().filter((cell) => visibleColumnIds.has(cell.column.id))
    : row.getVisibleCells()
  return (
    <div
      role="row"
      data-index={dataIndex}
      data-last={isLastRow ? 'true' : undefined}
      data-clickable={(onRowClick || rowCursor) ? 'true' : undefined}
      ref={measureRef}
      onClick={onRowClick ? () => onRowClick(row.original) : undefined}
      className={cn(
        'gridkit-row',
        classNames?.row,
      )}
      style={{ ...styles?.row, minHeight: rowHeight, ...style }}
    >
      {visibleCells.map((cell, idx) => {
        const isLast = idx === visibleCells.length - 1
        const isFillCell = fillLast && isLast && !cell.column.getIsPinned()

        return (
          <DataGridBodyCell
            key={cell.id}
            cell={cell}
            row={row}
            table={table}
            bordered={bordered}
            isLast={isLast}
            isFillCell={isFillCell}
            pinning={pinning}
            onActionTrigger={onActionTrigger}
            classNames={classNames}
            styles={styles}
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

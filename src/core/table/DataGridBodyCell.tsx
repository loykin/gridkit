import { type Cell, type Row, type Table } from '@tanstack/react-table'
import { useEditingCell } from '@/features/editing/EditingCellContext'
import { EditableCellContent } from '@/features/editing/EditableCellContent'
import { RowActionTrigger } from '@/features/actions/RowActionTrigger'
import { cn } from '@/lib/utils'
import type { DataGridClassNames, DataGridStyles } from '@/types'
import { colStyle, isPinnedEdge } from './tableUtils'

interface DataGridBodyCellProps<T extends object> {
  cell: Cell<T, unknown>
  row: Row<T>
  table: Table<T>
  bordered?: boolean
  isLast?: boolean
  isFillCell?: boolean
  pinning?: boolean
  onActionTrigger?: (row: T, el: HTMLElement) => void
  classNames?: DataGridClassNames
  styles?: DataGridStyles
}

export function DataGridBodyCell<T extends object>({
  cell,
  row,
  table,
  bordered = false,
  isLast = false,
  isFillCell = false,
  pinning = true,
  onActionTrigger,
  classNames,
  styles,
}: DataGridBodyCellProps<T>) {
  const editingCtx = useEditingCell()
  const meta = cell.column.columnDef.meta
  const pinned = cell.column.getIsPinned()
  const edge = isPinnedEdge(cell.column, table)
  const isEditing = editingCtx?.editingCellId === cell.id
  const canEdit = !!meta?.editCell

  return (
    <div
      role="gridcell"
      data-col-id={cell.column.id}
      data-align={meta?.align ?? undefined}
      data-wrap={meta?.wrap ? 'true' : undefined}
      data-pinned={pinned || undefined}
      data-pinned-edge={edge || undefined}
      data-last-col={isLast ? 'true' : undefined}
      data-bordered={bordered ? 'true' : undefined}
      data-editing={isEditing ? 'true' : undefined}
      data-overflow={meta?.cellOverflow}
      className={cn('gridkit-cell', classNames?.cell)}
      style={{ ...styles?.cell, ...colStyle(cell.column, { pinning }), ...(isFillCell && { flex: 1, width: 'auto' }) }}
      onDoubleClick={canEdit && !isEditing ? (e) => { e.stopPropagation(); editingCtx?.startEdit(cell.id) } : undefined}
    >
      {isEditing && meta?.editCell ? (
        <EditableCellContent cell={cell} row={row} />
      ) : meta?.actions != null ? (
        <RowActionTrigger row={row} onActionTrigger={onActionTrigger} />
      ) : (
        <EditableCellContent cell={cell} row={row} />
      )}
    </div>
  )
}

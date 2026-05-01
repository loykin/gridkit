import type { CSSProperties } from 'react'
import { flexRender, type Row, type Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'
import type { DataGridClassNames, TableViewConfig, TableWidthMode } from '@/types'
import { colStyle, isPinnedEdge } from './tableUtils'
import { useEditingCell } from '@/features/editing/EditingCellContext'

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
  const icons = useIcons()
  const visibleCells = row.getVisibleCells()
  const editingCtx = useEditingCell()
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
        const meta = cell.column.columnDef.meta
        const edge = isPinnedEdge(cell.column, table)
        const isLast = idx === visibleCells.length - 1
        const isFillCell = fillLast && isLast
        const isEditing = editingCtx?.editingCellId === cell.id
        const canEdit = !!meta?.editCell

        return (
          <div
            role="gridcell"
            key={cell.id}
            data-col-id={cell.column.id}
            data-align={meta?.align ?? undefined}
            data-wrap={meta?.wrap ? 'true' : undefined}
            data-pinned={edge === 'left-edge' ? 'left' : edge === 'right-edge' ? 'right' : undefined}
            data-bordered={bordered ? 'true' : undefined}
            data-editing={isEditing ? 'true' : undefined}
            className={cn(
              'dg-cell',
              classNames?.cell,
            )}
            style={{ ...colStyle(cell.column), ...(isFillCell && { flex: 1, width: 'auto' }) }}
            onDoubleClick={canEdit && !isEditing ? (e) => { e.stopPropagation(); editingCtx?.startEdit(cell.id) } : undefined}
          >
            {isEditing && meta?.editCell ? (
              meta.editCell({
                value: row.getValue(cell.column.id),
                row: row.original,
                context: cell.getContext(),
                onCommit: (value) => editingCtx?.commitEdit(row.id, cell.column.id, value),
                onCancel: () => editingCtx?.stopEdit(),
              })
            ) : meta?.actions != null ? (
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => {
                  e.stopPropagation()
                  onActionTrigger?.(row.original, e.currentTarget as HTMLElement)
                }}
              >
                {icons.rowActions}
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
        />
      )}
    </div>
  )
}

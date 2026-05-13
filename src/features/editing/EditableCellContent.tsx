import { flexRender, type Cell, type Row } from '@tanstack/react-table'
import { useEditingCell } from './EditingCellContext'

interface EditableCellContentProps<T extends object> {
  cell: Cell<T, unknown>
  row: Row<T>
}

export function EditableCellContent<T extends object>({
  cell,
  row,
}: EditableCellContentProps<T>) {
  const editingCtx = useEditingCell()
  const meta = cell.column.columnDef.meta
  const isEditing = editingCtx?.editingCellId === cell.id

  if (isEditing && meta?.editCell) {
    return meta.editCell({
      value: row.getValue(cell.column.id),
      row: row.original,
      context: cell.getContext(),
      onCommit: (value) => editingCtx?.commitEdit(row.id, cell.column.id, value),
      onCancel: () => editingCtx?.stopEdit(),
    })
  }

  return flexRender(cell.column.columnDef.cell, cell.getContext())
}

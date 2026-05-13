import type { ColumnPinningState } from '@tanstack/react-table'
import type { DataGridColumnDef } from '@/types'

export function deriveInitialColumnPinning<T extends object>(
  columns: DataGridColumnDef<T>[],
  initialPinning?: ColumnPinningState,
): ColumnPinningState {
  const fromMeta: ColumnPinningState = { left: [], right: [] }

  for (const col of columns) {
    const pin = col.meta?.pin
    const id = (col as { accessorKey?: string }).accessorKey ?? (col as { id?: string }).id
    if (!pin || !id) continue
    if (pin === 'left') fromMeta.left!.push(id)
    else fromMeta.right!.push(id)
  }

  return {
    left: [...(fromMeta.left ?? []), ...(initialPinning?.left ?? [])],
    right: [...(fromMeta.right ?? []), ...(initialPinning?.right ?? [])],
  }
}

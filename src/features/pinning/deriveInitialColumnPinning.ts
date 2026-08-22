import type { ColumnPinningState } from '@/core/engine/tanstack/gridKitTable'
import type { DataGridColumnDef } from '@/types'

export function deriveInitialColumnPinning<T extends object>(
  columns: DataGridColumnDef<T>[],
  initialPinning?: ColumnPinningState,
): ColumnPinningState {
  const fromMeta: ColumnPinningState = { start: [], end: [] }

  for (const col of columns) {
    const pin = col.meta?.pin
    const id = (col as { accessorKey?: string }).accessorKey ?? (col as { id?: string }).id
    if (!pin || !id) continue
    if (pin === 'start') fromMeta.start!.push(id)
    else fromMeta.end!.push(id)
  }

  return {
    start: [...(fromMeta.start ?? []), ...(initialPinning?.start ?? [])],
    end: [...(fromMeta.end ?? []), ...(initialPinning?.end ?? [])],
  }
}

import type { Header } from '@/core/engine/tanstack/gridKitTable'
import { ColumnPinPopover } from './ColumnPinPopover'

interface ColumnPinControlProps<T extends object> {
  header: Header<T, unknown>
  enabled?: boolean
}

export function ColumnPinControl<T extends object>({
  header,
  enabled,
}: ColumnPinControlProps<T>) {
  const isLeafHeader = header.subHeaders.length === 0 && !header.isPlaceholder
  if (
    !isLeafHeader
    || !enabled
    || header.column.columnDef.meta?.pinControl === false
  ) return null

  return <ColumnPinPopover col={header.column} />
}

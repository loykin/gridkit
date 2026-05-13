import type { Header } from '@tanstack/react-table'
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
  if (!isLeafHeader || !enabled) return null

  return <ColumnPinPopover col={header.column} />
}

import type { Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import type { GridKitHeaderSlot } from '@/types'

interface DataGridToolbarProps<T extends object> {
  table: Table<T>
  headerLeft?: GridKitHeaderSlot<T>
  headerRight?: GridKitHeaderSlot<T>
  className?: string
}

function renderHeaderSlot<T extends object>(
  slot: GridKitHeaderSlot<T> | undefined,
  table: Table<T>,
) {
  return typeof slot === 'function' ? slot(table) : slot
}

export function DataGridToolbar<T extends object>({
  table,
  headerLeft,
  headerRight,
  className,
}: DataGridToolbarProps<T>) {
  if (!(headerLeft || headerRight)) {
    return null
  }

  return (
    <div className={cn('dg-toolbar', className)}>
      <div className="dg-toolbar-left">{renderHeaderSlot(headerLeft, table)}</div>
      <div className="dg-toolbar-right">{renderHeaderSlot(headerRight, table)}</div>
    </div>
  )
}

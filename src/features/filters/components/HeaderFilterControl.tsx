import type { Table, Header } from '@tanstack/react-table'
import { HeaderFilterPopover } from './HeaderFilterPopover'
import type { TableViewConfig } from '@/types'

interface HeaderFilterControlProps<T extends object> {
  header: Header<T, unknown>
  table: Table<T>
  enabled?: boolean
  filterDisplay?: 'row' | 'icon'
  customFilterComponents?: TableViewConfig<T>['customFilterComponents']
}

export function HeaderFilterControl<T extends object>({
  header,
  table,
  enabled,
  filterDisplay = 'row',
  customFilterComponents,
}: HeaderFilterControlProps<T>) {
  const isLeafHeader = header.subHeaders.length === 0 && !header.isPlaceholder
  if (!isLeafHeader || !enabled || filterDisplay !== 'icon') return null

  return (
    <HeaderFilterPopover
      col={header.column}
      table={table}
      customFilterComponents={customFilterComponents}
    />
  )
}

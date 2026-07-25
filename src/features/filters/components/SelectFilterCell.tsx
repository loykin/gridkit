import type { Column, Table } from '@tanstack/react-table'
import { useColumnOptions } from '@/features/filters/hooks/useColumnOptions'
import { Select } from '@/core/UIComponents'

interface Props<T extends object> {
  col: Column<T>
  table: Table<T>
  onSelect?: () => void
}

export function SelectFilterCell<T extends object>({ col, table, onSelect }: Props<T>) {
  const { columnFilters, globalFilter } = table.getState()
  const { options, isLoading } = useColumnOptions(table, col.id, true, {
    columnFilters,
    globalFilter,
  })
  const filterValue = (col.getFilterValue() ?? '') as string

  return (
    <Select
      value={filterValue}
      onValueChange={(value) => {
        col.setFilterValue(value || undefined)
        onSelect?.()
      }}
      style={{ width: '100%' }}
      disabled={isLoading}
      options={[
        { value: '', label: isLoading ? 'Loading...' : 'All' },
        ...options.map((option) => ({ value: option, label: option })),
      ]}
    />
  )
}

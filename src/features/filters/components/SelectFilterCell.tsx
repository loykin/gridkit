import type { Column, Table } from '@tanstack/react-table'
import { useColumnOptions } from '@/features/filters/hooks/useColumnOptions'

interface Props<T extends object> {
  col: Column<T>
  table: Table<T>
  onSelect?: () => void
}

export function SelectFilterCell<T extends object>({ col, table, onSelect }: Props<T>) {
  const { options, isLoading } = useColumnOptions(table, col.id)
  const filterValue = (col.getFilterValue() ?? '') as string

  return (
    <select
      value={filterValue}
      onChange={(e) => {
        col.setFilterValue(e.target.value || undefined)
        onSelect?.()
      }}
      className="dg-select"
      style={{ width: '100%' }}
      disabled={isLoading}
    >
      <option value="">{isLoading ? 'Loading...' : 'All'}</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}

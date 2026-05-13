import { useEffect, useState } from 'react'
import type { Column, Table } from '@tanstack/react-table'
import { getColumnOptions } from '@/core/hooks/useColumnOptions'

interface Props<T extends object> {
  col: Column<T>
  table: Table<T>
  onSelect?: () => void
}

export function SelectFilterCell<T extends object>({ col, table, onSelect }: Props<T>) {
  const [options, setOptions] = useState<string[]>([])
  const filterValue = (col.getFilterValue() ?? '') as string

  useEffect(() => {
    setOptions(getColumnOptions(table, col.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <select
      value={filterValue}
      onChange={(e) => {
        col.setFilterValue(e.target.value || undefined)
        onSelect?.()
      }}
      className="dg-select"
      style={{ width: '100%' }}
    >
      <option value="">All</option>
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt}
        </option>
      ))}
    </select>
  )
}

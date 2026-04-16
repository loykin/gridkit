import { useState } from 'react'
import type { Column, Table } from '@tanstack/react-table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getColumnOptions } from '@/core/hooks/useColumnOptions'

interface Props<T extends object> {
  col: Column<T>
  table: Table<T>
  onSelect?: () => void
}

export function SelectFilterCell<T extends object>({ col, table, onSelect }: Props<T>) {
  const [options, setOptions] = useState<{ label: string; value: string | null }[] | null>(null)
  const filterValue = (col.getFilterValue() ?? '') as string

  const handleOpenChange = (open: boolean) => {
    if (open && options === null) {
      const sorted = getColumnOptions(table, col.id)
      setOptions([{ label: 'All', value: null }, ...sorted.map((v) => ({ label: v, value: v }))])
    }
  }

  const items = options ?? []

  return (
    <Select
      items={items}
      value={filterValue || null}
      onValueChange={(val) => {
        col.setFilterValue(val ?? undefined)
        onSelect?.()
      }}
      onOpenChange={handleOpenChange}
    >
      <SelectTrigger size="sm" className="h-7 w-full text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value ?? '__all__'} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

import { useEffect, useState } from 'react'
import type { Column, Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { getColumnOptions } from '@/core/hooks/useColumnOptions'

interface Props<T extends object> {
  col: Column<T>
  table: Table<T>
}

export function MultiSelectContent<T extends object>({ col, table }: Props<T>) {
  const [options, setOptions] = useState<string[] | null>(null)
  const selected = (col.getFilterValue() as string[] | undefined) ?? []

  useEffect(() => {
    setOptions(getColumnOptions(table, col.id))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = (val: string) => {
    const next = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    col.setFilterValue(next.length > 0 ? next : undefined)
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="max-h-48 overflow-y-auto flex flex-col gap-0.5">
        {(options ?? []).map((opt) => (
          <label
            key={opt}
            className="flex items-center gap-2 px-1 py-1 cursor-pointer hover:bg-muted rounded-sm text-xs select-none"
          >
            <Checkbox
              checked={selected.includes(opt)}
              onCheckedChange={() => toggle(opt)}
              className="shrink-0"
            />
            <span className="truncate">{opt}</span>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 text-xs mt-1"
          onClick={() => col.setFilterValue(undefined)}
        >
          Clear ({selected.length})
        </Button>
      )}
    </div>
  )
}

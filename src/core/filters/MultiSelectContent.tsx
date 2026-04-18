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
    // intentional empty deps: options are derived from static column facet data,
    // computed once on mount to avoid re-scanning the full dataset on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = (val: string) => {
    const next = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    col.setFilterValue(next.length > 0 ? next : undefined)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ maxHeight: 192, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {(options ?? []).map((opt) => (
          <label
            key={opt}
            className="dg-multi-option"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px', cursor: 'pointer', fontSize: 12 }}
          >
            <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt}</span>
          </label>
        ))}
      </div>
      {selected.length > 0 && (
        <Button variant="ghost" size="sm" style={{ marginTop: 4 }} onClick={() => col.setFilterValue(undefined)}>
          Clear ({selected.length})
        </Button>
      )}
    </div>
  )
}

import type { Column, Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useColumnOptions } from '@/features/filters/hooks/useColumnOptions'

interface Props<T extends object> {
  col: Column<T>
  table: Table<T>
}

export function MultiSelectContent<T extends object>({ col, table }: Props<T>) {
  const { columnFilters, globalFilter } = table.getState()
  const { options, hasEmpty, isLoading } = useColumnOptions(table, col.id, true, {
    columnFilters,
    globalFilter,
  })
  const displayOptions = hasEmpty ? ['', ...options] : options
  const selected = (col.getFilterValue() as string[] | undefined) ?? []

  const toggle = (val: string) => {
    const next = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    col.setFilterValue(next.length > 0 ? next : undefined)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <div style={{ maxHeight: 192, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {isLoading && (
          <div style={{ padding: '4px 4px', fontSize: 12, color: 'var(--dg-muted-foreground)' }}>
            Loading...
          </div>
        )}
        {!isLoading && displayOptions.map((opt) => (
          <label
            key={opt || '__empty__'}
            className="dg-multi-option"
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px', cursor: 'pointer', fontSize: 12 }}
          >
            <Checkbox checked={selected.includes(opt)} onCheckedChange={() => toggle(opt)} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {opt || '(빈값)'}
            </span>
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

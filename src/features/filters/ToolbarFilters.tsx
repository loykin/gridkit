import { useEffect, useState } from 'react'
import type { Table } from '@tanstack/react-table'
import { Check, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { getColumnOptions } from '@/core/hooks/useColumnOptions'

// ─────────────────────────────────────────────────────────────────────────────
// SelectFilter — single value dropdown for toolbar
// ─────────────────────────────────────────────────────────────────────────────

interface SelectFilterProps<T extends object> {
  table: Table<T>
  columnId: string
  label: string
}

export function SelectFilter<T extends object>({ table, columnId, label }: SelectFilterProps<T>) {
  const icons = useIcons()
  const [options, setOptions] = useState<string[] | null>(null)
  const col = table.getColumn(columnId)
  const value = (col?.getFilterValue() ?? '') as string

  const handleOpenChange = (open: boolean) => {
    if (open && options === null) {
      setOptions(getColumnOptions(table, columnId))
    }
  }

  if (!col) return null

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            variant={value ? 'secondary' : 'outline'}
            size="sm"
          >
            {value ? (
              <><span style={{ fontWeight: 400, color: 'var(--dg-muted-foreground)' }}>{label}:</span> {value}</>
            ) : label}
            <ChevronDown />
          </Button>
        )}
      />
      <PopoverContent align="start" style={{ width: 176, padding: 4 }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {value && (
            <button
              onClick={() => col.setFilterValue(undefined)}
              className="dg-popover-option"
            >
              {icons.clearFilter} Clear
            </button>
          )}
          {(options ?? []).map((opt) => (
            <button
              key={opt}
              onClick={() => col.setFilterValue(opt === value ? undefined : opt)}
              className="dg-popover-option"
            >
              <Check style={{ opacity: opt === value ? 1 : 0, width: 12, height: 12 }} />
              {opt}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MultiSelectFilter — multi-value checkbox dropdown for toolbar
// ─────────────────────────────────────────────────────────────────────────────

interface MultiSelectFilterProps<T extends object> {
  table: Table<T>
  columnId: string
  label: string
}

export function MultiSelectFilter<T extends object>({
  table,
  columnId,
  label,
}: MultiSelectFilterProps<T>) {
  const [options, setOptions] = useState<string[] | null>(null)
  const col = table.getColumn(columnId)
  const selected = (col?.getFilterValue() as string[] | undefined) ?? []

  useEffect(() => {
    setOptions(getColumnOptions(table, columnId))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggle = (val: string) => {
    if (!col) return
    const next = selected.includes(val) ? selected.filter((v) => v !== val) : [...selected, val]
    col.setFilterValue(next.length > 0 ? next : undefined)
  }

  if (!col) return null

  return (
    <Popover>
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            variant={selected.length > 0 ? 'secondary' : 'outline'}
            size="sm"
          >
            {selected.length > 0 ? (
              <><span style={{ fontWeight: 400, color: 'var(--dg-muted-foreground)' }}>{label}:</span>{' '}
              {selected.length} selected</>
            ) : (
              label
            )}
            <ChevronDown />
          </Button>
        )}
      />
      <PopoverContent align="start" style={{ width: 192 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ maxHeight: 208, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(options ?? []).map((opt) => (
              <label
                key={opt}
                className="dg-multi-option"
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 4px', cursor: 'pointer', fontSize: 12 }}
              >
                <Checkbox
                  checked={selected.includes(opt)}
                  onCheckedChange={() => toggle(opt)}
                />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt}</span>
              </label>
            ))}
          </div>
          {selected.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              style={{ marginTop: 4 }}
              onClick={() => col.setFilterValue(undefined)}
            >
              Clear ({selected.length})
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

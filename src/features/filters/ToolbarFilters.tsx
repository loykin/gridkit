import { useEffect, useState } from 'react'
import type { Table } from '@tanstack/react-table'
import { Check, ChevronDown, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
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
            className="h-8 gap-1.5 text-xs"
          >
            {value ? (
              <>
                <span className="font-normal text-muted-foreground">{label}:</span> {value}
              </>
            ) : (
              label
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      />
      <PopoverContent align="start" className="w-44 p-1">
        <div className="flex flex-col">
          {value && (
            <button
              onClick={() => col.setFilterValue(undefined)}
              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm hover:bg-muted text-muted-foreground"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          )}
          {(options ?? []).map((opt) => (
            <button
              key={opt}
              onClick={() => col.setFilterValue(opt === value ? undefined : opt)}
              className="flex items-center gap-2 px-2 py-1.5 text-xs rounded-sm hover:bg-muted"
            >
              <Check className={cn('h-3 w-3', opt === value ? 'opacity-100' : 'opacity-0')} />
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
            className="h-8 gap-1.5 text-xs"
          >
            {selected.length > 0 ? (
              <>
                <span className="font-normal text-muted-foreground">{label}:</span>{' '}
                {selected.length} selected
              </>
            ) : (
              label
            )}
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </Button>
        )}
      />
      <PopoverContent align="start" className="w-48">
        <div className="flex flex-col gap-0.5">
          <div className="max-h-52 overflow-y-auto flex flex-col gap-0.5">
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
      </PopoverContent>
    </Popover>
  )
}

import { useCallback, useState } from 'react'
import type { Column, Table } from '@tanstack/react-table'
import { Filter, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { SelectFilterCell } from './SelectFilterCell'
import { MultiSelectContent } from './MultiSelectContent'
import { NumberRangeFilterContent } from './NumberRangeFilterContent'

interface Props<T extends object> {
  col: Column<T>
  table: Table<T>
}

export function HeaderFilterPopover<T extends object>({ col, table }: Props<T>) {
  const [open, setOpen] = useState(false)
  // Stable ref callback — an inline arrow would create a new reference on every render,
  // causing React to call it as null→el each time, re-triggering focus()
  const focusRef = useCallback((el: HTMLInputElement | null) => {
    el?.focus({ preventScroll: true })
  }, [])

  const ft = col.columnDef.meta?.filterType
  if (ft === false || ft === undefined) return null

  const hasFilter = col.getIsFiltered()
  const filterValue = (col.getFilterValue() ?? '') as string

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              variant="ghost"
              size="icon-xs"
              className={cn(
                'h-5 w-5 shrink-0',
                hasFilter ? 'text-primary opacity-100' : 'opacity-0 group-hover:opacity-60',
              )}
            >
              <Filter className="h-3 w-3" />
            </Button>
          )}
        />
        <PopoverContent side="bottom" align="start" className="w-52">
          {ft === 'select' ? (
            <SelectFilterCell col={col} table={table} onSelect={() => setOpen(false)} />
          ) : ft === 'multi-select' ? (
            <MultiSelectContent col={col} table={table} />
          ) : ft === 'number' ? (
            <NumberRangeFilterContent col={col} />
          ) : (
            <div className="relative">
              <Input
                type="text"
                placeholder="Filter…"
                value={filterValue}
                onChange={(e) => col.setFilterValue(e.target.value || undefined)}
                className="h-7 text-xs pr-6"
                ref={focusRef}
              />
              {filterValue && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => col.setFilterValue(undefined)}
                  className="absolute right-0.5 top-1/2 -translate-y-1/2"
                >
                  <X />
                </Button>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

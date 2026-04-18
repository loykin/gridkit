import { useCallback, useState } from 'react'
import type { Column, Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SelectFilterCell } from './SelectFilterCell'
import { MultiSelectContent } from './MultiSelectContent'
import { NumberRangeFilterContent } from './NumberRangeFilterContent'

interface Props<T extends object> {
  col: Column<T>
  table: Table<T>
}

export function HeaderFilterPopover<T extends object>({ col, table }: Props<T>) {
  const [open, setOpen] = useState(false)
  const icons = useIcons()
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
              className={hasFilter ? 'dg-btn--filter-active' : 'dg-btn--filter-inactive'}
            >
              {icons.filter}
            </Button>
          )}
        />
        <PopoverContent side="bottom" align="start" style={{ width: 192 }}>
          {ft === 'select' ? (
            <SelectFilterCell col={col} table={table} onSelect={() => setOpen(false)} />
          ) : ft === 'multi-select' ? (
            <MultiSelectContent col={col} table={table} />
          ) : ft === 'number' ? (
            <NumberRangeFilterContent col={col} />
          ) : (
            <div style={{ position: 'relative' }}>
              <Input
                type="text"
                placeholder="Filter…"
                value={filterValue}
                onChange={(e) => col.setFilterValue(e.target.value || undefined)}
                style={{ paddingRight: 24 }}
                ref={focusRef}
              />
              {filterValue && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => col.setFilterValue(undefined)}
                  style={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)' }}
                >
                  {icons.clearFilter}
                </Button>
              )}
            </div>
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

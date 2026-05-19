import { useCallback, useState } from 'react'
import type { Column, Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { SelectFilterCell } from './SelectFilterCell'
import { MultiSelectContent } from './MultiSelectContent'
import { NumberRangeFilterContent } from './NumberRangeFilterContent'
import { DateFilterContent } from './DateFilterContent'
import type { CustomFilterComponents } from '@/types'

interface Props<T extends object> {
  col: Column<T>
  table: Table<T>
  customFilterComponents?: CustomFilterComponents<T>
}

export function HeaderFilterPopover<T extends object>({ col, table, customFilterComponents }: Props<T>) {
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
  const CustomFilter = customFilterComponents?.[ft]
  const popoverWidth = ft === 'datetime' || ft === 'datetime-range' ? 280 : 192

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              aria-label={`Filter ${col.id}`}
              variant="ghost"
              size="icon-xs"
              className={hasFilter ? 'dg-btn--filter-active' : 'dg-btn--filter-inactive'}
            >
              {icons.filter}
            </Button>
          )}
        />
        <PopoverContent className="dg-header-popover" side="bottom" align="start" style={{ width: popoverWidth }}>
          {CustomFilter ? (
            <CustomFilter
              column={col}
              table={table}
              value={col.getFilterValue()}
              onChange={(value) => col.setFilterValue(value)}
              close={() => setOpen(false)}
            />
          ) : ft === 'select' ? (
            <SelectFilterCell col={col} table={table} onSelect={() => setOpen(false)} />
          ) : ft === 'multi-select' ? (
            <MultiSelectContent col={col} table={table} />
          ) : ft === 'number' ? (
            <NumberRangeFilterContent col={col} />
          ) : ft === 'date' || ft === 'date-range' || ft === 'datetime' || ft === 'datetime-range' ? (
            <DateFilterContent col={col} mode={ft} />
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
                  aria-label={`Clear ${col.id} filter`}
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

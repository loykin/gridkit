import type { Column, Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { MultiSelectContent } from './MultiSelectContent'

interface Props<T extends object> {
  col: Column<T>
  table: Table<T>
}

export function MultiSelectFilterCell<T extends object>({ col, table }: Props<T>) {
  const selected = (col.getFilterValue() as string[] | undefined) ?? []
  const label = selected.length > 0 ? `${selected.length} selected` : 'Filter…'

  return (
    <Popover>
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            variant={selected.length > 0 ? 'outline' : 'ghost'}
            size="sm"
            className="h-7 w-full justify-start text-xs font-normal"
          >
            <span className="truncate">{label}</span>
          </Button>
        )}
      />
      <PopoverContent side="bottom" align="start" className="w-48">
        <MultiSelectContent col={col} table={table} />
      </PopoverContent>
    </Popover>
  )
}

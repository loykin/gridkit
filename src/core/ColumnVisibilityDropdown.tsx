import type { Table } from '@tanstack/react-table'
import { Columns3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Props<T extends object> {
  table: Table<T>
}

export function ColumnVisibilityDropdown<T extends object>({ table }: Props<T>) {
  return (
    <Popover>
      <PopoverTrigger render={(props) => (
        <Button {...props} variant="outline" size="sm" className="gap-1.5">
          <Columns3 className="h-4 w-4" />
          Columns
        </Button>
      )} />
      <PopoverContent align="end" className="w-48">
        <div className="flex flex-col gap-1.5">
          {table
            .getAllLeafColumns()
            .filter((col) => col.id !== '__select__')
            .map((col) => (
              <label key={col.id} className="flex items-center gap-2 cursor-pointer text-sm">
                <Checkbox
                  checked={col.getIsVisible()}
                  onCheckedChange={col.toggleVisibility}
                />
                <span className="truncate">
                  {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                </span>
              </label>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

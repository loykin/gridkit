import type { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'
import { Checkbox } from '@/components/ui/checkbox'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

interface Props<T extends object> {
  table: Table<T>
}

export function ColumnVisibilityDropdown<T extends object>({ table }: Props<T>) {
  const icons = useIcons()
  return (
    <Popover>
      <PopoverTrigger
        render={(props) => (
          <Button {...props} variant="outline" size="sm">
            {icons.columnVisibility}
            Columns
          </Button>
        )}
      />
      <PopoverContent align="end" style={{ width: 192 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {table
            .getAllLeafColumns()
            .filter((col) => col.id !== '__select__')
            .map((col) => (
              <label
                key={col.id}
                style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}
              >
                <Checkbox checked={col.getIsVisible()} onCheckedChange={col.toggleVisibility} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {typeof col.columnDef.header === 'string' ? col.columnDef.header : col.id}
                </span>
              </label>
            ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

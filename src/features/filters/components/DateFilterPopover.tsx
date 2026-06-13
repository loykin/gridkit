import type { Column } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useIcons } from '@/core/IconsContext'
import { DateFilterContent } from './DateFilterContent'

interface Props<T extends object> {
  col: Column<T>
  mode: 'date' | 'date-range' | 'datetime' | 'datetime-range'
}

function formatDateFilterLabel(value: unknown) {
  if (Array.isArray(value)) {
    const [start, end] = value as [string | undefined, string | undefined]
    if (start && end) return `${start} - ${end}`
    if (start) return `>= ${start}`
    if (end) return `<= ${end}`
    return 'Filter...'
  }

  return typeof value === 'string' && value ? value : 'Filter...'
}

export function DateFilterPopover<T extends object>({ col, mode }: Props<T>) {
  const icons = useIcons()
  const value = col.getFilterValue()
  const hasFilter = Array.isArray(value)
    ? Boolean(value[0] || value[1])
    : Boolean(value)
  const defaultWidth = mode === 'datetime' || mode === 'datetime-range' ? 280 : 240
  const width = col.columnDef.meta?.filterParams?.width ?? defaultWidth

  return (
    <Popover>
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            aria-label={`Filter ${col.id} by date`}
            variant={hasFilter ? 'outline' : 'ghost'}
            size="sm"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            {icons.filterRange}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {formatDateFilterLabel(value)}
            </span>
          </Button>
        )}
      />
      <PopoverContent className="gridkit-header-popover" side="bottom" align="start" style={{ width }}>
        <DateFilterContent col={col} mode={mode} />
      </PopoverContent>
    </Popover>
  )
}

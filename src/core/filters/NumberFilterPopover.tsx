import type { Column } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NumberRangeFilterContent } from './NumberRangeFilterContent'

interface Props<T extends object> {
  col: Column<T>
}

export function NumberFilterPopover<T extends object>({ col }: Props<T>) {
  const icons = useIcons()
  const numFilter = col.getFilterValue() as [string, string] | undefined
  const min = numFilter?.[0] ?? ''
  const max = numFilter?.[1] ?? ''
  const hasFilter = min !== '' || max !== ''

  const label = hasFilter
    ? [min && `≥${min}`, max && `≤${max}`].filter(Boolean).join(' ')
    : 'Filter…'

  return (
    <Popover>
      <PopoverTrigger
        render={(props) => (
          <Button
            {...props}
            variant={hasFilter ? 'outline' : 'ghost'}
            size="sm"
            style={{ width: '100%', justifyContent: 'flex-start' }}
          >
            {icons.filterRange}
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
          </Button>
        )}
      />
      <PopoverContent side="bottom" align="start" style={{ width: 192 }}>
        <NumberRangeFilterContent col={col} />
      </PopoverContent>
    </Popover>
  )
}

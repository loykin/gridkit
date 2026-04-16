import type { Column } from '@tanstack/react-table'
import { SlidersHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { NumberRangeFilterContent } from './NumberRangeFilterContent'

interface Props<T extends object> {
  col: Column<T>
}

export function NumberFilterPopover<T extends object>({ col }: Props<T>) {
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
            className="h-7 w-full justify-start text-xs font-normal"
          >
            <SlidersHorizontal className="h-3 w-3 shrink-0" />
            <span className="truncate">{label}</span>
          </Button>
        )}
      />
      <PopoverContent side="bottom" align="start" className="w-48">
        <NumberRangeFilterContent col={col} />
      </PopoverContent>
    </Popover>
  )
}

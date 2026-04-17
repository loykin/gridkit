import type { Column } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

interface Props<T extends object> {
  col: Column<T>
}

export function NumberRangeFilterContent<T extends object>({ col }: Props<T>) {
  const numFilter = col.getFilterValue() as [string, string] | undefined
  const min = numFilter?.[0] ?? ''
  const max = numFilter?.[1] ?? ''
  const hasFilter = min !== '' || max !== ''

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <span className="text-xs text-[var(--dg-muted-foreground)]">Min</span>
        <Input
          type="number"
          placeholder="Min"
          value={min}
          onChange={(e) =>
            col.setFilterValue((old: [string, string] = ['', '']) => [e.target.value, old[1]])
          }
          className="h-7 text-xs"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-[var(--dg-muted-foreground)]">Max</span>
        <Input
          type="number"
          placeholder="Max"
          value={max}
          onChange={(e) =>
            col.setFilterValue((old: [string, string] = ['', '']) => [old[0], e.target.value])
          }
          className="h-7 text-xs"
        />
      </div>
      {hasFilter && (
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs"
          onClick={() => col.setFilterValue(undefined)}
        >
          Clear
        </Button>
      )}
    </div>
  )
}

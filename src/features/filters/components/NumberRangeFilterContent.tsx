import type { Column } from '@tanstack/react-table'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useGridKitLabels } from '@/core/LabelsContext'

interface Props<T extends object> {
  col: Column<T>
}

export function NumberRangeFilterContent<T extends object>({ col }: Props<T>) {
  const labels = useGridKitLabels()
  const numFilter = col.getFilterValue() as [string, string] | undefined
  const min = numFilter?.[0] ?? ''
  const max = numFilter?.[1] ?? ''
  const hasFilter = min !== '' || max !== ''

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--gridkit-muted-foreground)' }}>{labels.min}</span>
        <Input
          type="number"
          placeholder={labels.min}
          value={min}
          onChange={(e) =>
            col.setFilterValue((old: [string, string] = ['', '']) => [e.target.value, old[1]])
          }
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontSize: 12, color: 'var(--gridkit-muted-foreground)' }}>{labels.max}</span>
        <Input
          type="number"
          placeholder={labels.max}
          value={max}
          onChange={(e) =>
            col.setFilterValue((old: [string, string] = ['', '']) => [old[0], e.target.value])
          }
        />
      </div>
      {hasFilter && (
        <Button
          aria-label={labels.clearNumberRangeFilter}
          variant="ghost"
          size="sm"
          onClick={() => col.setFilterValue(undefined)}
        >
          {labels.clear}
        </Button>
      )}
    </div>
  )
}

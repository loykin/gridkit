import type { Column } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useIcons } from '@/core/IconsContext'

interface Props<T extends object> {
  col: Column<T>
  mode: 'date' | 'date-range' | 'datetime' | 'datetime-range'
}

export function DateFilterContent<T extends object>({ col, mode }: Props<T>) {
  const icons = useIcons()
  const value = col.getFilterValue()
  const singleValue = typeof value === 'string' ? value : ''
  const rangeValue = Array.isArray(value) && value.length === 2
    ? value as [string, string]
    : ['', ''] as [string, string]
  const inputType = mode === 'datetime' || mode === 'datetime-range' ? 'datetime-local' : 'date'
  const isRange = mode === 'date-range' || mode === 'datetime-range'

  if (!isRange) {
    return (
      <div style={{ position: 'relative', minWidth: inputType === 'datetime-local' ? 240 : undefined }}>
        <Input
          type={inputType}
          step={inputType === 'datetime-local' ? 1 : undefined}
          value={singleValue}
          onChange={(e) => col.setFilterValue(e.target.value || undefined)}
          style={{ paddingRight: 24 }}
        />
        {singleValue && (
          <Button
            aria-label="Clear date filter"
            variant="ghost"
            size="icon-xs"
            onClick={() => col.setFilterValue(undefined)}
            style={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)' }}
          >
            {icons.clearFilter}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gap: 6, minWidth: inputType === 'datetime-local' ? 240 : undefined }}>
      <Input
        type={inputType}
        step={inputType === 'datetime-local' ? 1 : undefined}
        value={rangeValue[0]}
        onChange={(e) => {
          const next: [string, string] = [e.target.value, rangeValue[1]]
          col.setFilterValue(next[0] || next[1] ? next : undefined)
        }}
      />
      <Input
        type={inputType}
        step={inputType === 'datetime-local' ? 1 : undefined}
        value={rangeValue[1]}
        onChange={(e) => {
          const next: [string, string] = [rangeValue[0], e.target.value]
          col.setFilterValue(next[0] || next[1] ? next : undefined)
        }}
      />
      {(rangeValue[0] || rangeValue[1]) && (
        <Button variant="ghost" size="sm" onClick={() => col.setFilterValue(undefined)}>
          {icons.clearFilter}
          Clear
        </Button>
      )}
    </div>
  )
}

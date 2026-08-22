import type { Row } from '@/core/engine/tanstack/gridKitTable'
import { Button } from '@/core/UIComponents'
import { useIcons } from '@/core/IconsContext'

interface RowActionTriggerProps<T extends object> {
  row: Row<T>
  onActionTrigger?: (row: T, el: HTMLElement) => void
}

export function RowActionTrigger<T extends object>({
  row,
  onActionTrigger,
}: RowActionTriggerProps<T>) {
  const icons = useIcons()

  return (
    <Button
      aria-label={`Open row actions for row ${row.id}`}
      aria-haspopup="menu"
      variant="ghost"
      size="icon-xs"
      onClick={(e) => {
        e.stopPropagation()
        onActionTrigger?.(row.original, e.currentTarget as HTMLElement)
      }}
    >
      {icons.rowActions}
    </Button>
  )
}

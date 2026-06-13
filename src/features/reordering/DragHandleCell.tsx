import { useContext } from 'react'
import { RowDragContext } from '@/features/reordering/RowDragContext'
import { useIcons } from '@/core/IconsContext'

/**
 * Drag handle cell — place in whichever column should act as the grab handle.
 * Reads listeners/attributes from RowDragContext set by SortableRow.
 * Only works inside DataGridDrag.
 *
 * Usage:
 *   { id: 'drag', size: 36, enableResizing: false,
 *     cell: () => <DragHandleCell /> }
 */
export function DragHandleCell() {
  const ctx = useContext(RowDragContext)
  const icons = useIcons()

  return (
    <button
      type="button"
      aria-label="Drag row"
      {...ctx?.listeners}
      {...ctx?.attributes}
      className="gridkit-btn gridkit-btn--drag-handle"
      data-variant="ghost"
      style={{
        width: '100%',
        height: '100%',
        cursor: 'grab',
        touchAction: 'none',
        color: 'color-mix(in oklab, var(--gridkit-muted-foreground) 40%, transparent)',
      }}
    >
      {icons.dragHandle}
    </button>
  )
}

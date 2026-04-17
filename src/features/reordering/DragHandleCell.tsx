import { useContext } from 'react'
import { GripVertical } from 'lucide-react'
import { RowDragContext } from '@/features/reordering/RowDragContext'

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

  return (
    <button
      type="button"
      {...ctx?.listeners}
      {...ctx?.attributes}
      className="flex items-center justify-center w-full h-full cursor-grab active:cursor-grabbing text-[var(--dg-muted-foreground)]/40 hover:text-[var(--dg-muted-foreground)] transition-colors"
      style={{ touchAction: 'none' }}
    >
      <GripVertical className="h-4 w-4" />
    </button>
  )
}

import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Row } from '@tanstack/react-table'
import { RowDragContext } from '@/features/reordering/RowDragContext'

interface SortableRowProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: Row<any>
  children: ReactNode
}

/**
 * Wraps a DataGridBodyRow with dnd-kit sortable behaviour.
 * Provides RowDragContext so DragHandleCell can attach listeners without props.
 */
export function SortableRow({ row, children }: SortableRowProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: row.id,
  })

  return (
    <RowDragContext.Provider value={{ listeners, attributes, isDragging }}>
      <div
        ref={setNodeRef}
        style={{
          transform: CSS.Transform.toString(transform),
          transition,
          opacity: isDragging ? 0.4 : 1,
          position: 'relative',
          zIndex: isDragging ? 1 : 0,
        }}
      >
        {children}
      </div>
    </RowDragContext.Provider>
  )
}

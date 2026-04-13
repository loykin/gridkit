import React from 'react'
import type { DraggableSyntheticListeners } from '@dnd-kit/core'

export interface RowDragContextValue {
  listeners: DraggableSyntheticListeners | undefined
  attributes: Record<string, any>
  isDragging: boolean
}

/**
 * Provides drag handle listeners/attributes to DragHandleCell.
 * Set by SortableRow for each row — DragHandleCell reads it via useContext.
 */
export const RowDragContext = React.createContext<RowDragContextValue | null>(null)

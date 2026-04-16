import type React from 'react'
import type { Column, Table } from '@tanstack/react-table'

export function colStyle<T extends object>(col: Column<T>): React.CSSProperties {
  const pinned = col.getIsPinned()
  return {
    width: col.getSize(),
    flexShrink: 0,
    ...(pinned === 'left' && { position: 'sticky', left: col.getStart('left'), zIndex: 1 }),
    ...(pinned === 'right' && { position: 'sticky', right: col.getAfter('right'), zIndex: 1 }),
  }
}

export function isPinnedEdge<T extends object>(
  col: Column<T>,
  table: Table<T>,
): 'left-edge' | 'right-edge' | false {
  const pinned = col.getIsPinned()
  if (pinned === 'left') {
    const leftCols = table.getLeftLeafColumns()
    return leftCols[leftCols.length - 1]?.id === col.id ? 'left-edge' : false
  }
  if (pinned === 'right') {
    const rightCols = table.getRightLeafColumns()
    return rightCols[0]?.id === col.id ? 'right-edge' : false
  }
  return false
}

import type React from 'react'
import type { Column, Table } from '@tanstack/react-table'

// JS owns all column dimensions. Never set width/flex on individual cells via CSS —
// only col.getSize() is the source of truth. CSS handles appearance only.
export function colStyle<T extends object>(
  col: Column<T>,
  options: { pinning?: boolean } = {},
): React.CSSProperties {
  const pinning = options.pinning ?? true
  const pinned = col.getIsPinned()
  return {
    width: col.getSize(),
    flexShrink: 0,
    ...(pinning && pinned === 'left' && { position: 'sticky', left: col.getStart('left'), zIndex: 1 }),
    ...(pinning && pinned === 'right' && { position: 'sticky', right: col.getAfter('right'), zIndex: 1 }),
  }
}

export type ColumnRegion = 'left' | 'center' | 'right'

export function splitVisibleColumnsByPin<T extends object>(columns: Column<T>[]) {
  return {
    left: columns.filter((column) => column.getIsPinned() === 'left'),
    center: columns.filter((column) => !column.getIsPinned()),
    right: columns.filter((column) => column.getIsPinned() === 'right'),
  } satisfies Record<ColumnRegion, Column<T>[]>
}

export function getColumnsWidth<T extends object>(columns: Column<T>[]) {
  return columns.reduce((sum, column) => sum + column.getSize(), 0)
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

import type React from 'react'
import type { Header } from '@tanstack/react-table'

interface ColumnResizeHandleProps<T extends object> {
  header: Header<T, unknown>
  enabled?: boolean
}

export function ColumnResizeHandle<T extends object>({
  header,
  enabled,
}: ColumnResizeHandleProps<T>) {
  const isLeafHeader = header.subHeaders.length === 0 && !header.isPlaceholder
  const canResize = isLeafHeader && enabled && header.column.getCanResize()
  if (!canResize) return null
  const resizeFromLeft = header.column.getIsPinned() === 'right'

  const handleRightPinnedPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch') return
    e.stopPropagation()
    e.preventDefault()

    const startX = e.clientX
    const startSize = header.column.getSize()
    const columnId = header.column.id
    const minSize = header.column.columnDef.minSize ?? 20
    const maxSize = header.column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER
    const table = header.getContext().table

    const onMove = (event: PointerEvent) => {
      const nextSize = Math.max(minSize, Math.min(maxSize, startSize - (event.clientX - startX)))
      table.setColumnSizing((current) => ({
        ...current,
        [columnId]: nextSize,
      }))
    }

    const onUp = () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
  }

  return (
    <div
      onPointerDown={(e) => {
        if (resizeFromLeft) {
          handleRightPinnedPointerDown(e)
          return
        }
        if (e.pointerType === 'touch') return
        e.stopPropagation()
        header.getResizeHandler(e.currentTarget.ownerDocument)(e)
      }}
      onTouchStart={(e) => {
        e.stopPropagation()
        header.getResizeHandler(e.currentTarget.ownerDocument)(e)
      }}
      onClick={(e) => e.stopPropagation()}
      data-side={resizeFromLeft ? 'left' : 'right'}
      className="dg-resize-handle"
    >
      <div
        data-resizing={header.column.getIsResizing() ? 'true' : undefined}
        className="dg-resize-bar"
      />
    </div>
  )
}

import type { Header } from '@tanstack/react-table'

interface ColumnResizeHandleProps<T extends object> {
  header: Header<T, unknown>
  enabled?: boolean
}

export function ColumnResizeHandle<T extends object>({
  header,
  enabled,
}: ColumnResizeHandleProps<T>) {
  const canResize = !header.isPlaceholder && enabled && header.column.getCanResize()
  if (!canResize) return null

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation()
      }}
      onMouseDown={(e) => {
        e.stopPropagation()
        header.getResizeHandler()(e)
      }}
      onTouchStart={(e) => {
        e.stopPropagation()
        header.getResizeHandler()(e)
      }}
      onClick={(e) => e.stopPropagation()}
      className="dg-resize-handle"
    >
      <div
        data-resizing={header.column.getIsResizing() ? 'true' : undefined}
        className="dg-resize-bar"
      />
    </div>
  )
}

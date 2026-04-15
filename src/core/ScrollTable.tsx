import * as React from 'react'

/**
 * ScrollTable — DataGrid body content wrapper with table semantics.
 *
 * Uses <div role="table"> instead of <table> to support the separated
 * header/body scroll architecture:
 *   - Header panel: overflow:hidden, scrollLeft synced via JS
 *   - Body panel:   overflow:auto, actual scroll container
 *
 * This eliminates the scrollbar-track-over-header problem that occurred
 * when both were inside a single overflow:auto container.
 */
const ScrollTable = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      role="table"
      className={['text-sm', className].filter(Boolean).join(' ')}
      {...props}
    />
  ),
)
ScrollTable.displayName = 'ScrollTable'

export { ScrollTable }

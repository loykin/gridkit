import type { Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'

interface DataGridPaginationPagesProps<T extends object> {
  table: Table<T>
  /**
   * Number of page buttons to show on each side of the current page.
   * Default: 2 → produces: 1 … 3 [4] 5 … 20
   */
  siblingCount?: number
  className?: string
}

// ── Page number generation ─────────────────────────────────────────────────────

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}

function getPageItems(
  current: number, // 0-indexed
  total: number,
  siblings: number,
): (number | 'ellipsis')[] {
  if (total <= 1) return [1]

  const page = current + 1 // 1-indexed for display
  const left = Math.max(page - siblings, 1)
  const right = Math.min(page + siblings, total)

  const showLeftEllipsis = left > 2
  const showRightEllipsis = right < total - 1

  if (!showLeftEllipsis && !showRightEllipsis) return range(1, total)
  if (!showLeftEllipsis) return [...range(1, right), 'ellipsis', total]
  if (!showRightEllipsis) return [1, 'ellipsis', ...range(left, total)]
  return [1, 'ellipsis', ...range(left, right), 'ellipsis', total]
}

// ── Component ──────────────────────────────────────────────────────────────────

/**
 * Numbered page pagination: << < 1 2 3 … 20 > >>
 * Suitable for footer or any layout with enough horizontal space.
 */
export function DataGridPaginationPages<T extends object>({
  table,
  siblingCount = 2,
  className,
}: DataGridPaginationPagesProps<T>) {
  const icons = useIcons()
  const { pageIndex } = table.getState().pagination
  const pageCount = Math.max(table.getPageCount(), 1)
  const items = getPageItems(pageIndex, pageCount, siblingCount)

  return (
    <div className={cn('gridkit-pagination-control gridkit-pagination-control--pages', className)}>
      <Button
        aria-label="Go to first page"
        variant="ghost"
        size="icon-xs"
        onClick={() => table.firstPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {icons.pageFirst}
      </Button>
      <Button
        aria-label="Go to previous page"
        variant="ghost"
        size="icon-xs"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {icons.pagePrev}
      </Button>

      {items.map((item, idx) =>
        item === 'ellipsis' ? (
          <span
            key={`ellipsis-${idx}`}
            style={{ padding: '0 2px', fontSize: 12, color: 'var(--gridkit-muted-foreground)' }}
          >
            …
          </span>
        ) : (
          <Button
            aria-label={`Go to page ${item}`}
            key={item}
            variant={item - 1 === pageIndex ? 'default' : 'ghost'}
            size="icon-xs"
            onClick={() => table.setPageIndex(item - 1)}
            style={{ width: 'auto', minWidth: 24, padding: '0 6px' }}
          >
            {item}
          </Button>
        ),
      )}

      <Button
        aria-label="Go to next page"
        variant="ghost"
        size="icon-xs"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        {icons.pageNext}
      </Button>
      <Button
        aria-label="Go to last page"
        variant="ghost"
        size="icon-xs"
        onClick={() => table.lastPage()}
        disabled={!table.getCanNextPage()}
      >
        {icons.pageLast}
      </Button>
    </div>
  )
}

import type { Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'

interface DataGridPaginationCompactProps<T extends object> {
  table: Table<T>
}

/**
 * Compact pagination control — designed for toolbar placement.
 * Shows page X / Y with prev/next navigation, no rows-per-page dropdown.
 * Use DataGridPaginationBar for full-featured footer pagination.
 */
export function DataGridPaginationCompact<T extends object>({
  table,
}: DataGridPaginationCompactProps<T>) {
  const icons = useIcons()
  const { pageIndex } = table.getState().pagination
  const pageCount = table.getPageCount()

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {icons.pagePrev}
      </Button>
      <span style={{ fontSize: 12, padding: '0 6px', whiteSpace: 'nowrap' }}>
        {pageIndex + 1} / {Math.max(pageCount, 1)}
      </span>
      <Button
        variant="ghost"
        size="icon-xs"
        onClick={() => table.nextPage()}
        disabled={!table.getCanNextPage()}
      >
        {icons.pageNext}
      </Button>
    </div>
  )
}

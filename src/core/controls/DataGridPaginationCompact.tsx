import type { Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'
import { useGridKitLabels } from '@/core/LabelsContext'

interface DataGridPaginationCompactProps<T extends object> {
  table: Table<T>
  className?: string
}

/**
 * Compact pagination control — designed for toolbar placement.
 * Shows page X / Y with prev/next navigation, no rows-per-page dropdown.
 * Use DataGridPaginationBar for full-featured footer pagination.
 */
export function DataGridPaginationCompact<T extends object>({
  table,
  className,
}: DataGridPaginationCompactProps<T>) {
  const icons = useIcons()
  const labels = useGridKitLabels()
  const { pageIndex } = table.getState().pagination
  const pageCount = table.getPageCount()

  return (
    <div className={cn('gridkit-pagination-control gridkit-pagination-control--compact', className)}>
      <Button
        aria-label={labels.goToPreviousPage}
        variant="ghost"
        size="icon-xs"
        onClick={() => table.previousPage()}
        disabled={!table.getCanPreviousPage()}
      >
        {icons.pagePrev}
      </Button>
      <span style={{ fontSize: 12, padding: '0 6px', whiteSpace: 'nowrap' }}>
        {labels.pageCompact({ pageIndex, pageCount })}
      </span>
      <Button
        aria-label={labels.goToNextPage}
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

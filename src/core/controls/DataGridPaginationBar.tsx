import type { Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Button } from '@/core/UIComponents'
import { Select } from '@/core/UIComponents'
import { useIcons } from '@/core/IconsContext'
import { useGridKitLabels } from '@/core/LabelsContext'

interface DataGridPaginationBarProps<T extends object> {
  table: Table<T>
  /** Page size options shown in the dropdown. Default: [10, 20, 50, 100] */
  pageSizes?: number[]
  /** Total row count for server-side display: "1–20 of 500" */
  totalCount?: number
  className?: string
}

export function DataGridPaginationBar<T extends object>({
  table,
  pageSizes = [10, 20, 50, 100],
  totalCount,
  className,
}: DataGridPaginationBarProps<T>) {
  const icons = useIcons()
  const labels = useGridKitLabels()
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()

  return (
    <div className={cn('gridkit-pagination-control gridkit-pagination-control--bar', className)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>{labels.rowsPerPage}</span>
        <Select
          value={pageSize}
          onValueChange={(value) => table.setPageSize(Number(value))}
          options={pageSizes.map((size) => ({ value: size, label: size }))}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>
          {labels.pageRange({ pageIndex, pageSize, pageCount, totalCount })}
        </span>
        <Button
          aria-label={labels.goToFirstPage}
          className="gridkit-page-first"
          variant="ghost"
          size="icon-sm"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {icons.pageFirst}
        </Button>
        <Button
          aria-label={labels.goToPreviousPage}
          className="gridkit-page-previous"
          variant="ghost"
          size="icon-sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {icons.pagePrev}
        </Button>
        <Button
          aria-label={labels.goToNextPage}
          className="gridkit-page-next"
          variant="ghost"
          size="icon-sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {icons.pageNext}
        </Button>
        <Button
          aria-label={labels.goToLastPage}
          className="gridkit-page-last"
          variant="ghost"
          size="icon-sm"
          onClick={() => table.lastPage()}
          disabled={!table.getCanNextPage()}
        >
          {icons.pageLast}
        </Button>
      </div>
    </div>
  )
}

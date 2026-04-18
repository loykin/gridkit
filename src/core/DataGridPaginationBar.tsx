import type { Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'

interface DataGridPaginationBarProps<T extends object> {
  table: Table<T>
  /** Page size options shown in the dropdown. Default: [10, 20, 50, 100] */
  pageSizes?: number[]
  /** Total row count for server-side display: "1–20 of 500" */
  totalCount?: number
}

export function DataGridPaginationBar<T extends object>({
  table,
  pageSizes = [10, 20, 50, 100],
  totalCount,
}: DataGridPaginationBarProps<T>) {
  const icons = useIcons()
  const { pageIndex, pageSize } = table.getState().pagination
  const pageCount = table.getPageCount()

  return (
    <div className={cn('dg-pagination')}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span>Rows per page</span>
        <select
          value={pageSize}
          onChange={(e) => table.setPageSize(Number(e.target.value))}
          className="dg-select"
        >
          {pageSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span>
          {totalCount !== undefined
            ? `${pageIndex * pageSize + 1}–${Math.min((pageIndex + 1) * pageSize, totalCount)} of ${totalCount}`
            : `Page ${pageIndex + 1} of ${Math.max(pageCount, 1)}`}
        </span>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => table.firstPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {icons.pageFirst}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          {icons.pagePrev}
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          {icons.pageNext}
        </Button>
        <Button
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

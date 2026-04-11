import type { DataGridProps } from './types'
import { useDataGridBase } from './hooks/useDataGridBase'
import { DataGridPaginationBar } from './DataGridPaginationBar'
import { DataGridShell } from './DataGridShell'

export function DataGrid<T extends object>(props: DataGridProps<T>) {
  const {
    error,
    leftFilters,
    rightFilters,
    enablePagination = true,
    pageSizes = [10, 20, 50, 100],
    totalCount,
  } = props

  const { wrapperRef, containerRef, table, rows, isSized, measure } =
    useDataGridBase(props)

  return (
    <DataGridShell
      {...props}
      wrapperRef={wrapperRef}
      containerRef={containerRef}
      table={table}
      rows={rows}
      isSized={isSized}
      measure={measure}
      error={error}
      leftFilters={leftFilters}
      rightFilters={rightFilters}
      footer={
        enablePagination ? (
          <DataGridPaginationBar
            table={table}
            pageSizes={pageSizes}
            totalCount={totalCount}
          />
        ) : null
      }
    />
  )
}

import type { DataGridProps } from './types'
import { useDataGridBase } from './hooks/useDataGridBase'
import { DataGridToolbar } from './DataGridToolbar'
import { DataGridTableView } from './DataGridTableView'
import { DataGridPaginationBar } from './DataGridPaginationBar'
import { cn } from '@/lib/utils'

export function DataGrid<T extends object>(props: DataGridProps<T>) {
  const {
    isLoading,
    error,
    leftFilters,
    rightFilters,
    enableColumnResizing = true,
    enableColumnFilters = false,
    onRowClick,
    rowCursor,
    tableHeight,
    tableWidthMode,
    emptyMessage,
    bordered,
    rowHeight,
    estimateRowHeight,
    overscan,
    enablePagination = true,
    pageSizes = [10, 20, 50, 100],
    totalCount,
  } = props

  const { wrapperRef, containerRef, table, rows, isSized, measure } =
    useDataGridBase(props)

  if (error) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-destructive">
        {error.message}
      </div>
    )
  }

  return (
    <div ref={wrapperRef} className="flex flex-col gap-3 w-full min-w-0 overflow-hidden">
      <DataGridToolbar
        table={table}
        leftFilters={leftFilters}
        rightFilters={rightFilters}
      />

      <div
        className={cn(
          'relative rounded-md min-w-0',
          !isSized && 'invisible'
        )}
      >
        {/* Visual border — absolute overlay so it doesn't affect layout/scroll */}
        <div className="absolute inset-0 rounded-md border pointer-events-none z-20" />
        <DataGridTableView
          table={table}
          rows={rows}
          containerRef={containerRef}
          isLoading={isLoading}
          emptyMessage={emptyMessage}
          onRowClick={onRowClick}
          rowCursor={rowCursor}
          enableColumnResizing={enableColumnResizing}
          enableColumnFilters={enableColumnFilters}
          tableHeight={tableHeight}
          tableWidthMode={tableWidthMode}
          bordered={bordered}
          rowHeight={rowHeight}
          estimateRowHeight={estimateRowHeight}
          overscan={overscan}
          onMeasureColumns={measure}
        />
      </div>

      {enablePagination && (
        <DataGridPaginationBar
          table={table}
          pageSizes={pageSizes}
          totalCount={totalCount}
        />
      )}
    </div>
  )
}

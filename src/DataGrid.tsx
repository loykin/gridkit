import { useEffect } from 'react'
import type { Table } from '@tanstack/react-table'
import type { DataGridProps } from '@/types'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'
import { DataGridPaginationBar } from '@/core/DataGridPaginationBar'
import { DataGridShell } from '@/core/DataGridShell'
import { IconsProvider } from '@/core/IconsContext'

interface DataGridPropsWithRef<T extends object> extends DataGridProps<T> {
  /** Ref populated with the TanStack Table instance after first render */
  tableRef?: React.RefObject<Table<T> | null>
}

export function DataGrid<T extends object>(props: DataGridPropsWithRef<T>) {
  const {
    error,
    leftFilters,
    rightFilters,
    enablePagination = true,
    pageSizes = [10, 20, 50, 100],
    totalCount,
    tableRef,
    icons,
  } = props

  const { wrapperRef, containerRef, table, rows, isSized, measure } = useDataGridBase(props)

  useEffect(() => {
    if (tableRef) {
      ;(tableRef as React.MutableRefObject<Table<T> | null>).current = table
      return () => {
        ;(tableRef as React.MutableRefObject<Table<T> | null>).current = null
      }
    }
  }, [table, tableRef])

  return (
    <IconsProvider icons={icons}>
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
            <DataGridPaginationBar table={table} pageSizes={pageSizes} totalCount={totalCount} />
          ) : null
        }
      />
    </IconsProvider>
  )
}

import { useMemo, useRef } from 'react'
import type { DataGridBaseProps, DataGridColumnDef } from '../types'
import { createCheckboxColumn } from '../CheckboxColumn'
import { useDataGridCore } from './useDataGridCore'
import { useColumnSizing } from './useColumnSizing'

interface UseDataGridBaseOptions<T extends object> extends DataGridBaseProps<T> {
  columns: DataGridColumnDef<T>[]
  // Pagination options (for DataGrid; Virtual/Infinity pass enablePagination: false)
  enablePagination?: boolean
  paginationConfig?: { pageSize?: number; initialPageIndex?: number }
  totalCount?: number
  onPageChange?: (pageIndex: number, pageSize: number) => void
  // Row identity — required for DataGridDrag stable reordering
  getRowId?: (originalRow: T, index: number) => string
}

export function useDataGridBase<T extends object>(options: UseDataGridBaseOptions<T>) {
  const {
    data = [],
    columns,
    enableSorting = true,
    initialSorting,
    onSortingChange,
    manualSorting,
    columnFilters,
    globalFilter,
    onGlobalFilterChange,
    searchableColumns,
    enableColumnResizing = true,
    enableColumnFilters = false,
    visibilityState,
    initialPinning,
    columnSizingMode = 'flex',
    checkboxConfig,
    enableExpanding,
    getSubRows,
    getRowId,
    tableKey,
    persistState,
    enablePagination = true,
    paginationConfig,
    totalCount,
    onPageChange,
    onTableReady,
    onColumnSizingChange,
    bordered,
  } = options

  const wrapperRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const columnsWithCheckbox = useMemo(() => {
    if (!checkboxConfig) return columns
    return [createCheckboxColumn(checkboxConfig), ...columns]
  }, [columns, checkboxConfig])

  const { sizing, isSized, setSizing, measure } = useColumnSizing({
    columns,
    containerRef,
    mode: columnSizingMode,
  })

  const { table } = useDataGridCore({
    data,
    columns: columnsWithCheckbox,
    enableSorting,
    initialSorting,
    onSortingChange,
    manualSorting,
    columnFilters,
    globalFilter,
    onGlobalFilterChange,
    searchableColumns,
    enableColumnResizing,
    enableColumnFilters,
    visibilityState,
    initialPinning,
    tableKey,
    persistState,
    enablePagination,
    paginationConfig,
    totalCount,
    onPageChange,
    onTableReady,
    onColumnSizingChange,
    enableExpanding,
    getSubRows,
    getRowId,
    sizing,
    setSizing,
  })

  const rows = table.getRowModel().rows

  return { wrapperRef, containerRef, table, rows, isSized, bordered, measure }
}

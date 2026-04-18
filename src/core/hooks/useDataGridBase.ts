import { useMemo, useRef } from 'react'
import type { DataGridBaseProps, DataGridColumnDef, DataGridPaginationConfig } from '@/types'
import { createCheckboxColumn } from '@/features/selection/CheckboxColumn'
import { useDataGridCore } from '@/core/hooks/useDataGridCore'
import { useColumnSizing } from '@/core/hooks/useColumnSizing'

interface UseDataGridBaseOptions<T extends object> extends DataGridBaseProps<T> {
  columns: DataGridColumnDef<T>[]
  /** Pagination config — presence enables pagination. Omit to disable. */
  pagination?: DataGridPaginationConfig
  // Row identity — required for DataGridDrag stable reordering
  getRowId?: (originalRow: T, index: number) => string
}

export function useDataGridBase<T extends object>(options: UseDataGridBaseOptions<T>) {
  const {
    data = [],
    dataStore,
    columns,
    enableSorting = true,
    initialSorting,
    onSortingChange,
    manualSorting,
    manualFiltering,
    columnFilters,
    onColumnFiltersChange,
    globalFilter,
    onGlobalFilterChange,
    searchableColumns,
    enableColumnResizing = true,
    columnResizeMode,
    enableColumnFilters = false,
    visibilityState,
    initialPinning,
    columnSizing,
    columnSizingMode = 'flex',
    checkboxConfig,
    enableExpanding,
    getSubRows,
    getRowId,
    tableKey,
    syncState,
    pagination,
    onTableReady,
    onColumnSizingChange,
    tableOptions,
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
    initialSizing: columnSizing,
  })

  const { table } = useDataGridCore({
    data,
    dataStore,
    columns: columnsWithCheckbox,
    enableSorting,
    initialSorting,
    onSortingChange,
    manualSorting,
    manualFiltering,
    columnFilters,
    onColumnFiltersChange,
    globalFilter,
    onGlobalFilterChange,
    searchableColumns,
    enableColumnResizing,
    columnResizeMode,
    enableColumnFilters,
    visibilityState,
    initialPinning,
    tableKey,
    syncState,
    pagination,
    onTableReady,
    onColumnSizingChange,
    tableOptions,
    enableExpanding,
    getSubRows,
    getRowId,
    sizing,
    setSizing,
  })

  const rows = table.getRowModel().rows

  return { wrapperRef, containerRef, table, rows, isSized, bordered, measure }
}

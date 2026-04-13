import { useCallback, useEffect, useRef, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  type ColumnFiltersState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type FilterFn,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import type { DataGridBaseProps, DataGridColumnDef } from '@/types'
import { useTableStore } from '@/core/hooks/useTableStore'

const defaultGlobalFilterFn: FilterFn<object> = (row, columnId, value: string) =>
  String(row.getValue(columnId) ?? '')
    .toLowerCase()
    .includes(value.toLowerCase())

/** Used for meta.filterType === 'multi-select' — checks row value is in selected array */
const multiSelectFilterFn: FilterFn<object> = (row, columnId, value: string[]) =>
  value.includes(String(row.getValue(columnId) ?? ''))
multiSelectFilterFn.autoRemove = (val: string[]) => !val || val.length === 0

/** Used for meta.filterType === 'number' — range [min, max] */
const betweenFilterFn: FilterFn<object> = (row, columnId, value: [string, string]) => {
  const raw = row.getValue<number>(columnId)
  const [minStr, maxStr] = value
  const min = minStr !== '' ? Number(minStr) : -Infinity
  const max = maxStr !== '' ? Number(maxStr) : Infinity
  return raw >= min && raw <= max
}
betweenFilterFn.autoRemove = (val: [string, string]) =>
  !val || (val[0] === '' && val[1] === '')

interface UseDataGridCoreOptions<T extends object>
  extends Pick<
    DataGridBaseProps<T>,
    | 'data'
    | 'enableSorting'
    | 'initialSorting'
    | 'onSortingChange'
    | 'manualSorting'
    | 'columnFilters'
    | 'globalFilter'
    | 'onGlobalFilterChange'
    | 'searchableColumns'
    | 'enableColumnResizing'
    | 'enableColumnFilters'
    | 'visibilityState'
    | 'initialPinning'
    | 'tableKey'
    | 'persistState'
    | 'onTableReady'
    | 'onColumnSizingChange'
    | 'enableExpanding'
    | 'getSubRows'
  > {
  columns: DataGridColumnDef<T>[]
  getRowId?: (originalRow: T, index: number) => string
  enablePagination?: boolean
  paginationConfig?: { pageSize?: number; initialPageIndex?: number }
  totalCount?: number
  onPageChange?: (pageIndex: number, pageSize: number) => void
  sizing: ColumnSizingState
  setSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>
}

export function useDataGridCore<T extends object>({
  data = [],
  columns,
  enableSorting = true,
  initialSorting,
  onSortingChange,
  manualSorting = false,
  columnFilters: externalColumnFilters,
  globalFilter: externalGlobalFilter,
  onGlobalFilterChange,
  searchableColumns,
  enableColumnResizing = true,
  enableColumnFilters = false,
  visibilityState,
  initialPinning,
  tableKey,
  persistState = false,
  enablePagination = true,
  paginationConfig,
  totalCount,
  onPageChange,
  onTableReady,
  onColumnSizingChange,
  enableExpanding = false,
  getSubRows,
  getRowId,
  sizing,
  setSizing,
}: UseDataGridCoreOptions<T>) {
  const { register, update, tables } = useTableStore()
  const persisted = tableKey ? tables[tableKey] : undefined

  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? [])
  // Derive pinning from column meta.pin, merged with explicit initialPinning prop
  const [columnPinning] = useState<ColumnPinningState>(() => {
    const fromMeta: ColumnPinningState = { left: [], right: [] }
    for (const col of columns) {
      const pin = col.meta?.pin
      const id = (col as { accessorKey?: string }).accessorKey ?? (col as { id?: string }).id
      if (!pin || !id) continue
      if (pin === 'left') fromMeta.left!.push(id)
      else fromMeta.right!.push(id)
    }
    return {
      left: [...(fromMeta.left ?? []), ...(initialPinning?.left ?? [])],
      right: [...(fromMeta.right ?? []), ...(initialPinning?.right ?? [])],
    }
  })
  const [internalFilters, setInternalFilters] = useState<ColumnFiltersState>([])
  const [internalGlobal, setInternalGlobal] = useState(persisted?.searchTerm ?? '')
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    visibilityState ?? {}
  )
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex:
      persisted?.pagination.pageIndex ??
      paginationConfig?.initialPageIndex ??
      0,
    pageSize:
      persisted?.pagination.pageSize ?? paginationConfig?.pageSize ?? 20,
  })

  const tableReadyCalled = useRef(false)

  // Register for state persistence
  useEffect(() => {
    if (tableKey && persistState) {
      register(tableKey, {
        pagination: {
          pageIndex: paginationConfig?.initialPageIndex ?? 0,
          pageSize: paginationConfig?.pageSize ?? 20,
        },
      })
    }
  }, [tableKey, persistState, register, paginationConfig])

  const effectiveGlobalFilter = externalGlobalFilter ?? internalGlobal
  const effectiveColumnFilters = externalColumnFilters ?? internalFilters

  // Build search filter for specified columns
  const searchableFilterFn: FilterFn<T> | undefined = searchableColumns?.length
    ? (row, _, value: string) => {
        const search = String(value).toLowerCase()
        return searchableColumns.some((colId) =>
          String(row.getValue(colId) ?? '')
            .toLowerCase()
            .includes(search)
        )
      }
    : undefined

  // Inject filterFn into columns that declare meta.filterType
  const enrichedColumns = columns.map((col) => {
    if (col.meta?.filterType === 'number' && !col.filterFn) {
      return { ...col, filterFn: betweenFilterFn as unknown as FilterFn<T> }
    }
    if (col.meta?.filterType === 'multi-select' && !col.filterFn) {
      return { ...col, filterFn: multiSelectFilterFn as unknown as FilterFn<T> }
    }
    return col
  })

  const table = useReactTable<T>({
    data,
    columns: enrichedColumns,
    getRowId,
    state: {
      sorting,
      columnFilters: effectiveColumnFilters,
      globalFilter: effectiveGlobalFilter,
      columnVisibility,
      columnSizing: sizing,
      columnPinning,
      ...(enablePagination ? { pagination } : {}),
      ...(enableExpanding ? { expanded } : {}),
    },
    manualSorting,
    manualPagination: totalCount !== undefined,
    pageCount:
      totalCount !== undefined && pagination.pageSize > 0
        ? Math.ceil(totalCount / pagination.pageSize)
        : undefined,

    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        onSortingChange?.(next)
        return next
      })
    },
    onColumnFiltersChange: externalColumnFilters
      ? undefined
      : (updater) => {
          setInternalFilters((prev) =>
            typeof updater === 'function' ? updater(prev) : updater
          )
        },
    onGlobalFilterChange: externalGlobalFilter
      ? undefined
      : (updater) => {
          const next =
            typeof updater === 'function' ? updater(internalGlobal) : updater
          setInternalGlobal(next as string)
          onGlobalFilterChange?.(next as string)
        },
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((prev) =>
        typeof updater === 'function' ? updater(prev) : updater
      )
    },
    onColumnSizingChange: (updater) => {
      setSizing((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        onColumnSizingChange?.(next)
        return next
      })
    },
    onPaginationChange: enablePagination
      ? (updater) => {
          setPagination((prev) => {
            const next =
              typeof updater === 'function' ? updater(prev) : updater
            if (tableKey && persistState) update(tableKey, { pagination: next })
            onPageChange?.(next.pageIndex, next.pageSize)
            return next
          })
        }
      : undefined,

    onExpandedChange: enableExpanding ? setExpanded : undefined,
    getSubRows,
    autoResetExpanded: false,
    // Explicitly derive canExpand from source data so depth-N rows show the
    // toggle button even before their children have been loaded into subRows
    // by the filtered/sorted row models.
    getRowCanExpand: getSubRows
      ? (row) => {
          const subs = getSubRows(row.original as T, row.index)
          return Array.isArray(subs) && subs.length > 0
        }
      : undefined,

    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: enableExpanding ? getExpandedRowModel() : undefined,
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,

    globalFilterFn:
      (searchableFilterFn as FilterFn<T> | undefined) ??
      (defaultGlobalFilterFn as unknown as FilterFn<T>),
    enableColumnResizing,
    columnResizeMode: 'onChange',
    enableSorting,
    enableColumnFilters,
  })

  const handleGlobalFilterChange = useCallback(
    (value: string) => {
      table.setGlobalFilter(value)
      if (externalGlobalFilter === undefined) {
        setInternalGlobal(value)
        onGlobalFilterChange?.(value)
      }
      if (tableKey && persistState) update(tableKey, { searchTerm: value })
    },
    [table, externalGlobalFilter, onGlobalFilterChange, tableKey, persistState, update]
  )

  useEffect(() => {
    if (!tableReadyCalled.current && onTableReady) {
      tableReadyCalled.current = true
      onTableReady(table)
    }
  }, [table, onTableReady])

  return {
    table,
    pagination,
    globalFilter: effectiveGlobalFilter,
    handleGlobalFilterChange,
  }
}

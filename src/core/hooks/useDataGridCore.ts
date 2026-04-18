import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
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
import type { DataGridBaseProps, DataGridColumnDef, DataGridPaginationConfig } from '@/types'
import { useTableStore } from '@/core/hooks/useTableStore'
import { gridKitFeatures, getDataStoreCoreRowModel } from '@/core/engine/gridKitFeatures'

// Stable no-op fallbacks for useSyncExternalStore when dataStore is absent
const _noopSubscribe = (_listener: () => void) => () => {}
const _noopGetVersion = () => 0

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultGlobalFilterFn: FilterFn<any> = (row, columnId, value: string) =>
  String(row.getValue(columnId) ?? '')
    .toLowerCase()
    .includes(value.toLowerCase())

/** Used for meta.filterType === 'multi-select' — checks row value is in selected array */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const multiSelectFilterFn: FilterFn<any> = (row, columnId, value: string[]) =>
  value.includes(String(row.getValue(columnId) ?? ''))
multiSelectFilterFn.autoRemove = (val: string[]) => !val || val.length === 0

/** Used for meta.filterType === 'number' — range [min, max] */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const betweenFilterFn: FilterFn<any> = (row, columnId, value: [string, string]) => {
  const raw = row.getValue<number>(columnId)
  const [minStr, maxStr] = value
  const min = minStr !== '' ? Number(minStr) : -Infinity
  const max = maxStr !== '' ? Number(maxStr) : Infinity
  return raw >= min && raw <= max
}
betweenFilterFn.autoRemove = (val: [string, string]) => !val || (val[0] === '' && val[1] === '')

interface UseDataGridCoreOptions<T extends object> extends Pick<
  DataGridBaseProps<T>,
  | 'data'
  | 'dataStore'
  | 'enableSorting'
  | 'initialSorting'
  | 'onSortingChange'
  | 'manualSorting'
  | 'manualFiltering'
  | 'columnFilters'
  | 'onColumnFiltersChange'
  | 'globalFilter'
  | 'onGlobalFilterChange'
  | 'searchableColumns'
  | 'enableColumnResizing'
  | 'columnResizeMode'
  | 'enableColumnFilters'
  | 'visibilityState'
  | 'initialPinning'
  | 'tableKey'
  | 'syncState'
  | 'onTableReady'
  | 'onColumnSizingChange'
  | 'enableExpanding'
  | 'getSubRows'
  | 'tableOptions'
> {
  columns: DataGridColumnDef<T>[]
  getRowId?: (originalRow: T, index: number) => string
  pagination?: DataGridPaginationConfig
  sizing: ColumnSizingState
  setSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>
}

export function useDataGridCore<T extends object>({
  data = [],
  dataStore,
  columns,
  enableSorting = true,
  initialSorting,
  onSortingChange,
  manualSorting = false,
  manualFiltering = false,
  columnFilters: externalColumnFilters,
  onColumnFiltersChange,
  globalFilter: externalGlobalFilter,
  onGlobalFilterChange,
  searchableColumns,
  enableColumnResizing = true,
  columnResizeMode = 'onChange',
  enableColumnFilters = false,
  visibilityState,
  initialPinning,
  tableKey,
  syncState = false,
  pagination,
  onTableReady,
  onColumnSizingChange,
  enableExpanding = false,
  getSubRows,
  getRowId,
  tableOptions,
  sizing,
  setSizing,
}: UseDataGridCoreOptions<T>) {
  const enablePagination = !!pagination

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
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(visibilityState ?? {})
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: persisted?.pagination.pageIndex ?? pagination?.initialPageIndex ?? 0,
    pageSize: persisted?.pagination.pageSize ?? pagination?.pageSize ?? 20,
  })

  const tableReadyCalled = useRef(false)

  // Register for state persistence
  useEffect(() => {
    if (tableKey && syncState) {
      register(tableKey, {
        pagination: {
          pageIndex: pagination?.initialPageIndex ?? 0,
          pageSize: pagination?.pageSize ?? 20,
        },
      })
    }
  }, [tableKey, syncState, register, pagination])

  const effectiveGlobalFilter = externalGlobalFilter ?? internalGlobal
  const effectiveColumnFilters = externalColumnFilters ?? internalFilters

  // Build search filter for specified columns
  const searchableFilterFn: FilterFn<T> | undefined = searchableColumns?.length
    ? (row, _, value: string) => {
        const search = String(value).toLowerCase()
        return searchableColumns.some((colId) =>
          String(row.getValue(colId) ?? '')
            .toLowerCase()
            .includes(search),
        )
      }
    : undefined

  // Inject filterFn into columns that declare meta.filterType
  const enrichedColumns = columns.map((col) => {
    if (col.meta?.filterType === 'number' && !col.filterFn) {
      return { ...col, filterFn: betweenFilterFn as FilterFn<T> }
    }
    if (col.meta?.filterType === 'multi-select' && !col.filterFn) {
      return { ...col, filterFn: multiSelectFilterFn as FilterFn<T> }
    }
    return col
  })

  // Subscribe to DataStore changes — triggers re-render when a transaction fires.
  // useSyncExternalStore must be called unconditionally, so noop stubs are used
  // when dataStore is absent. The returned version is unused; we only need the
  // subscription to cause the component to re-render so that the custom
  // getCoreRowModel (which reads store.getVersion() internally) can re-evaluate.
  useSyncExternalStore(
    dataStore ? dataStore.subscribe : _noopSubscribe,
    dataStore ? dataStore.getVersion : _noopGetVersion,
  )

  const table = useReactTable<T>({
    // Escape hatch — spread first so explicit props below always win
    ...tableOptions,
    // When dataStore is active, data is irrelevant — getDataStoreCoreRowModel
    // reads directly from the store. Pass empty array to satisfy the type.
    data: dataStore ? ([] as T[]) : data,
    columns: enrichedColumns,
    getRowId,
    _features: [...gridKitFeatures],
    dataStore,
    state: {
      sorting,
      columnFilters: effectiveColumnFilters,
      globalFilter: effectiveGlobalFilter,
      columnVisibility,
      columnSizing: sizing,
      columnPinning,
      ...(enablePagination ? { pagination: paginationState } : {}),
      ...(enableExpanding ? { expanded } : {}),
    },
    manualSorting,
    manualFiltering,
    manualPagination: !!pagination?.pageCount,
    pageCount: pagination?.pageCount,

    onSortingChange: (updater) => {
      setSorting((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        onSortingChange?.(next)
        return next
      })
    },
    onColumnFiltersChange: (updater) => {
      const next =
        typeof updater === 'function' ? updater(effectiveColumnFilters) : updater
      if (externalColumnFilters === undefined) setInternalFilters(next)
      onColumnFiltersChange?.(next)
    },
    onGlobalFilterChange: externalGlobalFilter
      ? undefined
      : (updater) => {
          const next = typeof updater === 'function' ? updater(internalGlobal) : updater
          setInternalGlobal(next as string)
          onGlobalFilterChange?.(next as string)
        },
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((prev) => (typeof updater === 'function' ? updater(prev) : updater))
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
          setPaginationState((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater
            if (tableKey && syncState) update(tableKey, { pagination: next })
            pagination?.onPageChange?.(next.pageIndex, next.pageSize)
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

    // Phase 3: row-caching model when DataStore is present; stock model otherwise
    getCoreRowModel: dataStore ? getDataStoreCoreRowModel<T>() : getCoreRowModel(),
    getExpandedRowModel: enableExpanding ? getExpandedRowModel() : undefined,
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,

    globalFilterFn:
      (searchableFilterFn as FilterFn<T> | undefined) ??
      (defaultGlobalFilterFn as unknown as FilterFn<T>),
    enableColumnResizing,
    columnResizeMode,
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
      if (tableKey && syncState) update(tableKey, { searchTerm: value })
    },
    [table, externalGlobalFilter, onGlobalFilterChange, tableKey, syncState, update],
  )

  useEffect(() => {
    if (!tableReadyCalled.current && onTableReady) {
      tableReadyCalled.current = true
      onTableReady(table)
    }
  }, [table, onTableReady])

  return {
    table,
    pagination: paginationState,
    globalFilter: effectiveGlobalFilter,
    handleGlobalFilterChange,
  }
}

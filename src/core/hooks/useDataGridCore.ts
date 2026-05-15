import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type FilterFn,
  type PaginationState,
  type SortingState,
  type Table,
  type VisibilityState,
} from '@tanstack/react-table'
import type {
  DataGridBaseProps,
  DataGridPaginationConfig,
} from '@/types'
import { useTableStore } from '@/core/hooks/useTableStore'
import { useGridStatePersistence } from '@/core/hooks/useGridStatePersistence'
import { useDataStoreSubscription } from '@/core/engine/useDataStoreSubscription'
import { useDataStoreQueryState } from '@/core/engine/useDataStoreQueryState'
import { gridKitFeatures, getDataStoreCoreRowModel } from '@/core/engine/gridKitFeatures'
import type { FilterExpr, QueryParams } from '@/core/engine/DataStoreBackend'
import { defaultGlobalFilterFn } from '@/features/filters/filterFns'
import { enrichFilterColumns } from '@/features/filters/enrichFilterColumns'
import { useSearchableFilterFn } from '@/features/filters/useSearchableFilterFn'
import { deriveInitialColumnPinning } from '@/features/pinning/deriveInitialColumnPinning'

interface UseDataGridCoreOptions<T extends object> extends Pick<
  DataGridBaseProps<T>,
  | 'data'
  | 'dataStore'
  | 'queryMode'
  | 'enableSorting'
  | 'enableMultiSort'
  | 'maxMultiSortColCount'
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
  | 'statePersistence'
  | 'onTableReady'
  | 'onColumnSizingChange'
  | 'enableExpanding'
  | 'getSubRows'
  | 'tableOptions'
  | 'enableColumnReordering'
  | 'onColumnOrderChange'
  | 'onColumnVisibilityChange'
  | 'enableColumnPinning'
  | 'onColumnPinningChange'
> {
  columns: DataGridBaseProps<T>['columns']
  getRowId?: (originalRow: T, index: number) => string
  pagination?: DataGridPaginationConfig
  sizing: ColumnSizingState
  setSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>
}

function isEmptyFilterValue(value: unknown) {
  if (value == null || value === '') return true
  if (Array.isArray(value)) return value.length === 0 || value.every((item) => item === '')
  return false
}

function filterValueToExpr<T extends object>(
  table: Table<T>,
  id: string,
  value: unknown,
): FilterExpr | undefined {
  if (isEmptyFilterValue(value)) return undefined

  const column = table.getColumn(id)
  const meta = column?.columnDef.meta
  const field = meta?.backendField ?? id
  const filterType = meta?.filterType

  if (Array.isArray(value)) {
    if (filterType === 'multi-select') return { field, op: 'in', value }
    return { field, op: 'range', value }
  }

  if (filterType === 'text' || filterType == null) {
    return { field, op: 'like', value }
  }

  return { field, op: 'eq', value }
}

export function useDataGridCore<T extends object>({
  data = [],
  dataStore,
  queryMode = 'client',
  columns,
  enableSorting = true,
  enableMultiSort = false,
  maxMultiSortColCount = 3,
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
  statePersistence,
  pagination,
  onTableReady,
  onColumnSizingChange,
  enableExpanding = false,
  getSubRows,
  getRowId,
  tableOptions,
  enableColumnReordering = false,
  onColumnOrderChange,
  onColumnVisibilityChange,
  onColumnPinningChange,
  sizing,
  setSizing,
}: UseDataGridCoreOptions<T>) {
  const enablePagination = !!pagination
  const enableBackendQuery = queryMode === 'backend' && !!dataStore

  const { register, update, tables } = useTableStore()
  const persisted = tableKey ? tables[tableKey] : undefined

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? [])
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(() =>
    deriveInitialColumnPinning(columns, initialPinning),
  )
  const [internalFilters, setInternalFilters] = useState<ColumnFiltersState>([])
  const [internalGlobal, setInternalGlobal] = useState(persisted?.searchTerm ?? '')
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<VisibilityState>({})
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: persisted?.pagination.pageIndex ?? pagination?.initialPageIndex ?? 0,
    pageSize: persisted?.pagination.pageSize ?? pagination?.pageSize ?? 20,
  })

  const tableReadyCalled = useRef(false)
  const backendQueryKeyRef = useRef<string | null>(null)
  const paginationOnPageChangeRef = useRef(pagination?.onPageChange)
  paginationOnPageChangeRef.current = pagination?.onPageChange

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
  const effectiveColumnVisibility = visibilityState ?? internalColumnVisibility

  const persistedState = useMemo(() => ({
    sizing,
    columnOrder,
    columnPinning,
    columnVisibility: effectiveColumnVisibility,
    sorting,
    columnFilters: effectiveColumnFilters,
    globalFilter: effectiveGlobalFilter,
    pageSize: paginationState.pageSize,
  }), [
    sizing,
    columnOrder,
    columnPinning,
    effectiveColumnVisibility,
    sorting,
    effectiveColumnFilters,
    effectiveGlobalFilter,
    paginationState.pageSize,
  ])

  useGridStatePersistence({
    tableKey,
    statePersistence,
    enablePagination,
    externalColumnFilters,
    externalGlobalFilter,
    externalColumnVisibility: visibilityState,
    setSizing,
    setColumnOrder,
    setColumnPinning,
    setInternalColumnVisibility,
    setSorting,
    setInternalFilters,
    setInternalGlobal,
    setPaginationState,
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    onColumnVisibilityChange,
    persistedState,
  })

  const searchableFilterFn = useSearchableFilterFn<T>(searchableColumns)
  const enrichedColumns = useMemo(() => enrichFilterColumns(columns), [columns])

  useDataStoreSubscription(dataStore)
  const queryState = useDataStoreQueryState(dataStore)

  const effectiveManualSorting = manualSorting || enableBackendQuery
  const effectiveManualFiltering = manualFiltering || enableBackendQuery
  const effectivePageCount = enableBackendQuery && enablePagination
    ? pagination?.pageCount ?? Math.ceil(queryState.total / paginationState.pageSize)
    : pagination?.pageCount

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
      columnVisibility: effectiveColumnVisibility,
      columnSizing: sizing,
      columnPinning,
      ...(enableColumnReordering ? { columnOrder } : {}),
      ...(enablePagination ? { pagination: paginationState } : {}),
      ...(enableExpanding ? { expanded } : {}),
    },
    manualSorting: effectiveManualSorting,
    manualFiltering: effectiveManualFiltering,
    manualPagination: enableBackendQuery ? enablePagination : !!pagination?.pageCount,
    pageCount: effectivePageCount,

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
    onGlobalFilterChange: (updater) => {
      const next = typeof updater === 'function' ? updater(effectiveGlobalFilter) : updater
      if (externalGlobalFilter === undefined) setInternalGlobal(next as string)
      onGlobalFilterChange?.(next as string)
    },
    onColumnVisibilityChange: (updater) => {
      const next = typeof updater === 'function' ? updater(effectiveColumnVisibility) : updater
      if (visibilityState === undefined) setInternalColumnVisibility(next)
      onColumnVisibilityChange?.(next)
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

    onColumnPinningChange: (updater) => {
      setColumnPinning((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater
        onColumnPinningChange?.(next)
        return next
      })
    },
    onColumnOrderChange: enableColumnReordering
      ? (updater) => {
          setColumnOrder((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater
            onColumnOrderChange?.(next)
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
    getSortedRowModel: effectiveManualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: effectiveManualFiltering ? undefined : getFilteredRowModel(),
    getPaginationRowModel: enablePagination && !enableBackendQuery ? getPaginationRowModel() : undefined,

    globalFilterFn:
      (searchableFilterFn as FilterFn<T> | undefined) ??
      (defaultGlobalFilterFn as unknown as FilterFn<T>),
    enableColumnResizing,
    columnResizeMode,
    enableSorting,
    enableMultiSort,
    maxMultiSortColCount,
    enableColumnFilters,
  })

  const handleGlobalFilterChange = useCallback(
    (value: string) => {
      table.setGlobalFilter(value)
      if (externalGlobalFilter === undefined) {
        setInternalGlobal(value)
      }
      onGlobalFilterChange?.(value)
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

  useEffect(() => {
    if (!enableBackendQuery || !dataStore) return

    const filters = effectiveColumnFilters
      .map((filter) => filterValueToExpr(table, filter.id, filter.value))
      .filter((filter): filter is FilterExpr => !!filter)

    const params: QueryParams = {
      filters,
      globalFilter: effectiveGlobalFilter || undefined,
      sort: sorting.map((sort) => ({
        field: table.getColumn(sort.id)?.columnDef.meta?.backendField ?? sort.id,
        desc: sort.desc,
      })),
      ...(enablePagination
        ? {
            limit: paginationState.pageSize,
            offset: paginationState.pageIndex * paginationState.pageSize,
          }
        : {}),
    }
    const queryKey = JSON.stringify({
      filters: params.filters,
      globalFilter: params.globalFilter,
      sort: params.sort,
    })

    if (
      enablePagination &&
      backendQueryKeyRef.current !== null &&
      backendQueryKeyRef.current !== queryKey &&
      paginationState.pageIndex !== 0
    ) {
      backendQueryKeyRef.current = queryKey
      const next = { pageIndex: 0, pageSize: paginationState.pageSize }
      setPaginationState(next)
      if (tableKey && syncState) update(tableKey, { pagination: next })
      paginationOnPageChangeRef.current?.(0, paginationState.pageSize)
      return
    }

    backendQueryKeyRef.current = queryKey

    void dataStore.query(params)
  }, [
    dataStore,
    effectiveColumnFilters,
    effectiveGlobalFilter,
    enableBackendQuery,
    enablePagination,
    paginationState.pageIndex,
    paginationState.pageSize,
    sorting,
    table,
    tableKey,
    syncState,
    update,
  ])

  return {
    table,
    pagination: paginationState,
    globalFilter: effectiveGlobalFilter,
    handleGlobalFilterChange,
    queryState,
  }
}

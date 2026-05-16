import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getGroupedRowModel,
  getPaginationRowModel,
  getExpandedRowModel,
  type ColumnFiltersState,
  type ColumnOrderState,
  type ColumnPinningState,
  type ColumnSizingState,
  type ExpandedState,
  type FilterFn,
  type GroupingState,
  type PaginationState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import type {
  DataGridBaseProps,
  DataGridPaginationConfig,
} from '@/types'
import { useTableStore } from '@/core/hooks/useTableStore'
import { useGridStatePersistence } from '@/core/hooks/useGridStatePersistence'
import { useDataStoreSubscription } from '@/core/engine/hooks/useDataStoreSubscription'
import { useDataStoreQueryState } from '@/core/engine/hooks/useDataStoreQueryState'
import { gridKitFeatures, getDataStoreCoreRowModel } from '@/core/engine/tanstack/gridKitFeatures'
import { useBackendQuerySync } from '@/core/engine/hooks/useBackendQuerySync'
import { useBackendCapabilitiesWarning } from '@/core/engine/hooks/useBackendCapabilitiesWarning'
import { defaultGlobalFilterFn } from '@/features/filters/logic/filterFns'
import { enrichFilterColumns } from '@/features/filters/logic/enrichFilterColumns'
import { useSearchableFilterFn } from '@/features/filters/hooks/useSearchableFilterFn'
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
  | 'enableGrouping'
  | 'grouping'
  | 'onGroupingChange'
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
  enableGrouping = false,
  grouping: externalGrouping,
  onGroupingChange,
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
  const [internalGrouping, setInternalGrouping] = useState<GroupingState>([])
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

  const effectiveGrouping = externalGrouping ?? internalGrouping
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
      ...((enableExpanding || enableGrouping) ? { expanded } : {}),
      ...(enableGrouping ? { grouping: effectiveGrouping } : {}),
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
    onGroupingChange: enableGrouping ? (updater) => {
      const next = typeof updater === 'function' ? updater(effectiveGrouping) : updater
      onGroupingChange?.(next)
      if (externalGrouping === undefined) setInternalGrouping(next)
    } : undefined,
    onExpandedChange: (enableExpanding || enableGrouping) ? setExpanded : undefined,
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
    getGroupedRowModel: enableGrouping ? getGroupedRowModel() : undefined,
    getExpandedRowModel: (enableExpanding || enableGrouping) ? getExpandedRowModel() : undefined,
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

  useBackendCapabilitiesWarning({
    enabled: enableBackendQuery,
    dataStore,
    enableSorting,
    enableMultiSort,
    enablePagination,
    hasColumnFilters: effectiveColumnFilters.length > 0 || enableColumnFilters,
    hasGlobalFilter: !!effectiveGlobalFilter,
  })

  useBackendQuerySync({
    enabled: enableBackendQuery,
    dataStore,
    table,
    columnFilters: effectiveColumnFilters,
    globalFilter: effectiveGlobalFilter,
    sorting,
    enablePagination,
    paginationState,
    setPaginationState,
    tableKey,
    syncState,
    updatePersistedPagination: update,
    pagination,
  })

  return {
    table,
    pagination: paginationState,
    globalFilter: effectiveGlobalFilter,
    handleGlobalFilterChange,
    queryState,
  }
}

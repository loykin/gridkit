import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from 'react'
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
  type VisibilityState,
} from '@tanstack/react-table'
import type {
  DataGridBaseProps,
  DataGridColumnDef,
  DataGridPaginationConfig,
  GridKitPersistedState,
  GridKitPersistedStateKey,
} from '@/types'
import { useTableStore } from '@/core/hooks/useTableStore'
import { gridKitFeatures, getDataStoreCoreRowModel } from '@/core/engine/gridKitFeatures'

// Stable no-op fallbacks for useSyncExternalStore when dataStore is absent
const _noopSubscribe = (_listener: () => void) => () => {}
const _noopGetVersion = () => 0

const DEFAULT_PERSISTED_STATE_KEYS: GridKitPersistedStateKey[] = [
  'columnSizing',
  'columnOrder',
  'columnPinning',
  'columnVisibility',
  'sorting',
  'pageSize',
]

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

function toDateKey(value: unknown): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const raw = String(value ?? '')
  const isoDate = /^\d{4}-\d{2}-\d{2}/.exec(raw)
  if (isoDate) return isoDate[0]
  const time = Date.parse(raw)
  return Number.isNaN(time) ? '' : new Date(time).toISOString().slice(0, 10)
}

function toDateTimeMs(value: unknown): number | undefined {
  if (value instanceof Date) {
    const time = value.getTime()
    return Number.isNaN(time) ? undefined : time
  }
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined

  const raw = String(value ?? '').trim()
  if (!raw) return undefined

  const normalized = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(raw)
    ? raw.replace(' ', 'T')
    : raw
  const time = Date.parse(normalized)
  return Number.isNaN(time) ? undefined : time
}

/** Used for meta.filterType === 'date' — exact date match */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dateFilterFn: FilterFn<any> = (row, columnId, value: string) => {
  if (!value) return true
  return toDateKey(row.getValue(columnId)) === value
}
dateFilterFn.autoRemove = (val: string) => !val

/** Used for meta.filterType === 'date-range' — inclusive [start, end] date range */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dateRangeFilterFn: FilterFn<any> = (row, columnId, value: [string, string]) => {
  const [start, end] = value
  if (!start && !end) return true
  const current = toDateKey(row.getValue(columnId))
  if (!current) return false
  return (!start || current >= start) && (!end || current <= end)
}
dateRangeFilterFn.autoRemove = (val: [string, string]) => !val || (val[0] === '' && val[1] === '')

/** Used for meta.filterType === 'datetime' — exact date-time match */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dateTimeFilterFn: FilterFn<any> = (row, columnId, value: string) => {
  const target = toDateTimeMs(value)
  const current = toDateTimeMs(row.getValue(columnId))
  return target === undefined || current === target
}
dateTimeFilterFn.autoRemove = (val: string) => !val

/** Used for meta.filterType === 'datetime-range' — inclusive [start, end] range */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dateTimeRangeFilterFn: FilterFn<any> = (row, columnId, value: [string, string]) => {
  const [startValue, endValue] = value
  const start = toDateTimeMs(startValue)
  const end = toDateTimeMs(endValue)
  if (start === undefined && end === undefined) return true
  const current = toDateTimeMs(row.getValue(columnId))
  if (current === undefined) return false
  return (start === undefined || current >= start) && (end === undefined || current <= end)
}
dateTimeRangeFilterFn.autoRemove = (val: [string, string]) => !val || (val[0] === '' && val[1] === '')

interface UseDataGridCoreOptions<T extends object> extends Pick<
  DataGridBaseProps<T>,
  | 'data'
  | 'dataStore'
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

  const { register, update, tables } = useTableStore()
  const persisted = tableKey ? tables[tableKey] : undefined

  const [columnOrder, setColumnOrder] = useState<ColumnOrderState>([])
  const [expanded, setExpanded] = useState<ExpandedState>({})
  const [sorting, setSorting] = useState<SortingState>(initialSorting ?? [])
  // Derive pinning from column meta.pin, merged with explicit initialPinning prop
  const [columnPinning, setColumnPinning] = useState<ColumnPinningState>(() => {
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
  const [internalColumnVisibility, setInternalColumnVisibility] = useState<VisibilityState>({})
  const [paginationState, setPaginationState] = useState<PaginationState>({
    pageIndex: persisted?.pagination.pageIndex ?? pagination?.initialPageIndex ?? 0,
    pageSize: persisted?.pagination.pageSize ?? pagination?.pageSize ?? 20,
  })

  const tableReadyCalled = useRef(false)
  const persistenceReadyRef = useRef(false)
  const persistenceSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persistenceKeys = statePersistence?.include ?? DEFAULT_PERSISTED_STATE_KEYS
  const shouldPersist = useCallback(
    (key: GridKitPersistedStateKey) => persistenceKeys.includes(key),
    [persistenceKeys],
  )

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

  useEffect(() => {
    if (!tableKey || !statePersistence) {
      persistenceReadyRef.current = false
      return
    }

    let cancelled = false
    persistenceReadyRef.current = false

    Promise.resolve(statePersistence.load?.(tableKey))
      .then((loaded) => {
        if (cancelled) return
        if (!loaded) {
          persistenceReadyRef.current = true
          return
        }

        if (shouldPersist('columnSizing') && loaded.columnSizing) {
          setSizing(loaded.columnSizing)
        }
        if (shouldPersist('columnOrder') && loaded.columnOrder) {
          setColumnOrder(loaded.columnOrder)
        }
        if (shouldPersist('columnPinning') && loaded.columnPinning) {
          setColumnPinning(loaded.columnPinning)
        }
        if (shouldPersist('columnVisibility') && loaded.columnVisibility && visibilityState === undefined) {
          setInternalColumnVisibility(loaded.columnVisibility)
          onColumnVisibilityChange?.(loaded.columnVisibility)
        }
        if (shouldPersist('sorting') && loaded.sorting) {
          setSorting(loaded.sorting)
          onSortingChange?.(loaded.sorting)
        }
        if (shouldPersist('columnFilters') && loaded.columnFilters && externalColumnFilters === undefined) {
          setInternalFilters(loaded.columnFilters)
          onColumnFiltersChange?.(loaded.columnFilters)
        }
        if (shouldPersist('globalFilter') && loaded.globalFilter !== undefined && externalGlobalFilter === undefined) {
          setInternalGlobal(loaded.globalFilter)
          onGlobalFilterChange?.(loaded.globalFilter)
        }
        const loadedPageSize = loaded.pageSize ?? loaded.pagination?.pageSize
        if (shouldPersist('pageSize') && loadedPageSize && enablePagination) {
          setPaginationState((prev) => ({ ...prev, pageIndex: 0, pageSize: loadedPageSize }))
        }

        persistenceReadyRef.current = true
      })
      .catch(() => {
        if (!cancelled) persistenceReadyRef.current = true
      })

    return () => {
      cancelled = true
    }
  }, [
    tableKey,
    statePersistence,
    shouldPersist,
    setSizing,
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    externalColumnFilters,
    externalGlobalFilter,
    visibilityState,
    onColumnVisibilityChange,
    enablePagination,
  ])

  const effectiveGlobalFilter = externalGlobalFilter ?? internalGlobal
  const effectiveColumnFilters = externalColumnFilters ?? internalFilters
  const effectiveColumnVisibility = visibilityState ?? internalColumnVisibility

  // Build search filter for specified columns
  const searchableFilterFn: FilterFn<T> | undefined = useMemo(
    () =>
      searchableColumns?.length
        ? (row, _, value: string) => {
            const search = String(value).toLowerCase()
            return searchableColumns.some((colId) =>
              String(row.getValue(colId) ?? '')
                .toLowerCase()
                .includes(search),
            )
          }
        : undefined,
    [searchableColumns],
  )

  // Inject filterFn into columns that declare meta.filterType
  const enrichedColumns = useMemo(
    () => {
      const enrichColumn = (col: DataGridColumnDef<T>): DataGridColumnDef<T> => {
        const childColumns = (col as { columns?: DataGridColumnDef<T>[] }).columns
        const withChildren = childColumns
          ? { ...col, columns: childColumns.map(enrichColumn) }
          : col

        if (col.meta?.filterType === 'number' && !col.filterFn) {
          return { ...withChildren, filterFn: betweenFilterFn as FilterFn<T> }
        }
        if (col.meta?.filterType === 'multi-select' && !col.filterFn) {
          return { ...withChildren, filterFn: multiSelectFilterFn as FilterFn<T> }
        }
        if (col.meta?.filterType === 'date' && !col.filterFn) {
          return { ...withChildren, filterFn: dateFilterFn as FilterFn<T> }
        }
        if (col.meta?.filterType === 'date-range' && !col.filterFn) {
          return { ...withChildren, filterFn: dateRangeFilterFn as FilterFn<T> }
        }
        if (col.meta?.filterType === 'datetime' && !col.filterFn) {
          return { ...withChildren, filterFn: dateTimeFilterFn as FilterFn<T> }
        }
        if (col.meta?.filterType === 'datetime-range' && !col.filterFn) {
          return { ...withChildren, filterFn: dateTimeRangeFilterFn as FilterFn<T> }
        }
        return withChildren
      }

      return columns.map(enrichColumn)
    },
    [columns],
  )

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
      columnVisibility: effectiveColumnVisibility,
      columnSizing: sizing,
      columnPinning,
      ...(enableColumnReordering ? { columnOrder } : {}),
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
    getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: manualFiltering ? undefined : getFilteredRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,

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

  useEffect(() => {
    if (!tableKey || !statePersistence || !persistenceReadyRef.current) return

    const nextState: Partial<GridKitPersistedState> = {}
    if (shouldPersist('columnSizing')) nextState.columnSizing = sizing
    if (shouldPersist('columnOrder')) nextState.columnOrder = columnOrder
    if (shouldPersist('columnPinning')) nextState.columnPinning = columnPinning
    if (shouldPersist('columnVisibility')) nextState.columnVisibility = effectiveColumnVisibility
    if (shouldPersist('sorting')) nextState.sorting = sorting
    if (shouldPersist('columnFilters')) nextState.columnFilters = effectiveColumnFilters
    if (shouldPersist('globalFilter')) nextState.globalFilter = effectiveGlobalFilter
    if (shouldPersist('pageSize') && enablePagination) nextState.pageSize = paginationState.pageSize

    if (persistenceSaveTimer.current) clearTimeout(persistenceSaveTimer.current)
    persistenceSaveTimer.current = setTimeout(() => {
      void statePersistence.save(tableKey, nextState)
    }, statePersistence.debounce ?? 500)

    return () => {
      if (persistenceSaveTimer.current) clearTimeout(persistenceSaveTimer.current)
    }
  }, [
    tableKey,
    statePersistence,
    shouldPersist,
    sizing,
    columnOrder,
    columnPinning,
    effectiveColumnVisibility,
    sorting,
    effectiveColumnFilters,
    effectiveGlobalFilter,
    enablePagination,
    paginationState.pageSize,
  ])

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

  return {
    table,
    pagination: paginationState,
    globalFilter: effectiveGlobalFilter,
    handleGlobalFilterChange,
  }
}

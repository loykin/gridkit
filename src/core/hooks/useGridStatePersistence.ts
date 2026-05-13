import type React from 'react'
import { useCallback, useEffect, useRef } from 'react'
import type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  PaginationState,
  SortingState,
  VisibilityState,
} from '@tanstack/react-table'
import type {
  GridKitPersistedState,
  GridKitPersistedStateKey,
  GridKitStatePersistence,
} from '@/types'

const DEFAULT_PERSISTED_STATE_KEYS: GridKitPersistedStateKey[] = [
  'columnSizing',
  'columnOrder',
  'columnPinning',
  'columnVisibility',
  'sorting',
  'pageSize',
]

interface UseGridStatePersistenceOptions {
  tableKey?: string
  statePersistence?: GridKitStatePersistence
  enablePagination: boolean
  externalColumnFilters?: ColumnFiltersState
  externalGlobalFilter?: string
  externalColumnVisibility?: VisibilityState
  setSizing: React.Dispatch<React.SetStateAction<ColumnSizingState>>
  setColumnOrder: React.Dispatch<React.SetStateAction<ColumnOrderState>>
  setColumnPinning: React.Dispatch<React.SetStateAction<ColumnPinningState>>
  setInternalColumnVisibility: React.Dispatch<React.SetStateAction<VisibilityState>>
  setSorting: React.Dispatch<React.SetStateAction<SortingState>>
  setInternalFilters: React.Dispatch<React.SetStateAction<ColumnFiltersState>>
  setInternalGlobal: React.Dispatch<React.SetStateAction<string>>
  setPaginationState: React.Dispatch<React.SetStateAction<PaginationState>>
  onSortingChange?: (sorting: SortingState) => void
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  onGlobalFilterChange?: (value: string) => void
  onColumnVisibilityChange?: (visibility: VisibilityState) => void
  persistedState: {
    sizing: ColumnSizingState
    columnOrder: ColumnOrderState
    columnPinning: ColumnPinningState
    columnVisibility: VisibilityState
    sorting: SortingState
    columnFilters: ColumnFiltersState
    globalFilter: string
    pageSize: number
  }
}

export function useGridStatePersistence({
  tableKey,
  statePersistence,
  enablePagination,
  externalColumnFilters,
  externalGlobalFilter,
  externalColumnVisibility,
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
}: UseGridStatePersistenceOptions) {
  const persistenceReadyRef = useRef(false)
  const persistenceSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const persistenceKeys = statePersistence?.include ?? DEFAULT_PERSISTED_STATE_KEYS
  const shouldPersist = useCallback(
    (key: GridKitPersistedStateKey) => persistenceKeys.includes(key),
    [persistenceKeys],
  )

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
        if (shouldPersist('columnVisibility') && loaded.columnVisibility && externalColumnVisibility === undefined) {
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
    externalColumnFilters,
    externalGlobalFilter,
    externalColumnVisibility,
    enablePagination,
  ])

  useEffect(() => {
    if (!tableKey || !statePersistence || !persistenceReadyRef.current) return

    const nextState: Partial<GridKitPersistedState> = {}
    if (shouldPersist('columnSizing')) nextState.columnSizing = persistedState.sizing
    if (shouldPersist('columnOrder')) nextState.columnOrder = persistedState.columnOrder
    if (shouldPersist('columnPinning')) nextState.columnPinning = persistedState.columnPinning
    if (shouldPersist('columnVisibility')) nextState.columnVisibility = persistedState.columnVisibility
    if (shouldPersist('sorting')) nextState.sorting = persistedState.sorting
    if (shouldPersist('columnFilters')) nextState.columnFilters = persistedState.columnFilters
    if (shouldPersist('globalFilter')) nextState.globalFilter = persistedState.globalFilter
    if (shouldPersist('pageSize') && enablePagination) nextState.pageSize = persistedState.pageSize

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
    persistedState,
    enablePagination,
  ])
}

import { useEffect, useRef } from 'react'
import type React from 'react'
import type { ColumnFiltersState, PaginationState, SortingState, Table } from '@tanstack/react-table'
import type { DataGridPaginationConfig } from '@/types'
import type { DataStore } from '../store/DataStore'
import { buildBackendQueryParams } from '../backend/buildBackendQueryParams'

export function useBackendQuerySync<T extends object>({
  enabled,
  dataStore,
  table,
  columnFilters,
  globalFilter,
  sorting,
  enablePagination,
  paginationState,
  setPaginationState,
  isPageIndexControlled,
  tableKey,
  syncState,
  updatePersistedPagination,
  pagination,
}: {
  enabled: boolean
  dataStore?: DataStore<T>
  table: Table<T>
  columnFilters: ColumnFiltersState
  globalFilter: string
  sorting: SortingState
  enablePagination: boolean
  paginationState: PaginationState
  setPaginationState: React.Dispatch<React.SetStateAction<PaginationState>>
  isPageIndexControlled: boolean
  tableKey?: string
  syncState: boolean
  updatePersistedPagination: (tableKey: string, value: { pagination: PaginationState }) => void
  pagination?: DataGridPaginationConfig
}) {
  const queryKeyRef = useRef<string | null>(null)
  const paginationOnPageChangeRef = useRef(pagination?.onPageChange)
  paginationOnPageChangeRef.current = pagination?.onPageChange
  const { pageIndex, pageSize } = paginationState

  useEffect(() => {
    if (!enabled || !dataStore) return

    const params = buildBackendQueryParams({
      table,
      columnFilters,
      globalFilter,
      sorting,
      pagination: enablePagination ? { pageIndex, pageSize } : undefined,
    })
    const queryKey = JSON.stringify({
      filters: params.filters,
      globalFilter: params.globalFilter,
      sort: params.sort,
    })

    if (
      enablePagination &&
      queryKeyRef.current !== null &&
      queryKeyRef.current !== queryKey &&
      pageIndex !== 0
    ) {
      queryKeyRef.current = queryKey
      const next = { pageIndex: 0, pageSize }
      if (!isPageIndexControlled) {
        setPaginationState(next)
      }
      if (tableKey && syncState) updatePersistedPagination(tableKey, { pagination: next })
      paginationOnPageChangeRef.current?.(0, pageSize)
      return
    }

    queryKeyRef.current = queryKey
    void dataStore.query(params)
  }, [
    columnFilters,
    dataStore,
    enablePagination,
    enabled,
    globalFilter,
    isPageIndexControlled,
    pageIndex,
    pageSize,
    setPaginationState,
    sorting,
    syncState,
    table,
    tableKey,
    updatePersistedPagination,
  ])
}

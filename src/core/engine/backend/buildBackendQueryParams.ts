import type { ColumnFiltersState, PaginationState, SortingState, Table } from '@tanstack/react-table'
import type { FilterExpr, QueryParams } from '../store/DataStoreBackend'

function isEmptyFilterValue(value: unknown) {
  if (value == null || value === '') return true
  if (Array.isArray(value)) return value.length === 0
  return false
}

export function getBackendField<T extends object>(table: Table<T>, columnId: string) {
  const meta = table.getColumn(columnId)?.columnDef.meta
  return meta?.backend?.field ?? meta?.backendField ?? columnId
}

export function filterValueToExpr<T extends object>(
  table: Table<T>,
  id: string,
  value: unknown,
): FilterExpr | undefined {
  if (isEmptyFilterValue(value)) return undefined

  const column = table.getColumn(id)
  const meta = column?.columnDef.meta
  const field = meta?.backend?.field ?? meta?.backendField ?? id
  const filterType = meta?.backend?.filterType ?? meta?.filterType

  if (filterType === false) return undefined

  if (Array.isArray(value)) {
    if (filterType === 'multi-select') {
      const nonEmptyValues = value.filter((item) => item !== '')
      if (nonEmptyValues.length === 0 && value.includes('')) return { field, op: 'empty' }
      return { field, op: 'in', value }
    }
    return { field, op: 'range', value }
  }

  if (filterType === 'text' || filterType == null) {
    return { field, op: 'like', value }
  }

  return { field, op: 'eq', value }
}

export function buildBackendFilters<T extends object>(
  table: Table<T>,
  columnFilters: ColumnFiltersState,
  options?: { excludeColumnId?: string },
): FilterExpr[] {
  return columnFilters
    .filter((filter) => filter.id !== options?.excludeColumnId)
    .map((filter) => filterValueToExpr(table, filter.id, filter.value))
    .filter((filter): filter is FilterExpr => !!filter)
}

export function buildBackendQueryParams<T extends object>({
  table,
  columnFilters,
  globalFilter,
  sorting,
  pagination,
}: {
  table: Table<T>
  columnFilters: ColumnFiltersState
  globalFilter: string
  sorting: SortingState
  pagination?: PaginationState
}): QueryParams {
  return {
    filters: buildBackendFilters(table, columnFilters),
    globalFilter: globalFilter || undefined,
    sort: sorting.map((sort) => ({
      field: getBackendField(table, sort.id),
      desc: sort.desc,
    })),
    ...(pagination
      ? {
          limit: pagination.pageSize,
          offset: pagination.pageIndex * pagination.pageSize,
        }
      : {}),
  }
}

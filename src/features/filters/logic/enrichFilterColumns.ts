import type { FilterFn } from '@tanstack/react-table'
import type { DataGridColumnDef } from '@/types'
import {
  betweenFilterFn,
  dateFilterFn,
  dateRangeFilterFn,
  dateTimeFilterFn,
  dateTimeRangeFilterFn,
  multiSelectFilterFn,
} from './filterFns'

export function enrichFilterColumns<T extends object>(
  columns: DataGridColumnDef<T>[],
): DataGridColumnDef<T>[] {
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
}

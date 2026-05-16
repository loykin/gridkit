import { useMemo } from 'react'
import type { FilterFn } from '@tanstack/react-table'

export function useSearchableFilterFn<T extends object>(
  searchableColumns?: string[],
): FilterFn<T> | undefined {
  return useMemo(
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
}

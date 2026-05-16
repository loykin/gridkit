import type { Table } from '@tanstack/react-table'
import { useEffect, useState } from 'react'
import { buildBackendFilters, getBackendField } from '@/core/engine/backend/buildBackendQueryParams'

/**
 * Scans all core rows for a column and returns unique, sorted string values.
 * Used by toolbar filters and table filter cells to build option lists.
 */
export function getColumnOptions<T extends object>(table: Table<T>, columnId: string): string[] {
  const vals = new Set<string>()
  table.getCoreRowModel().rows.forEach((row) => {
    const v = row.getValue(columnId)
    if (v != null) vals.add(String(v))
  })
  return Array.from(vals).sort()
}

export function useColumnOptions<T extends object>(
  table: Table<T>,
  columnId: string,
  enabled = true,
) {
  const [options, setOptions] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (!enabled) return

    const dataStore = table.options.dataStore
    const hasBackendFacets = !!dataStore?.hasBackendFacets()

    if (!dataStore || !hasBackendFacets) {
      setOptions(getColumnOptions(table, columnId))
      return
    }

    let cancelled = false
    setIsLoading(true)

    dataStore.getFacets({
      field: getBackendField(table, columnId),
      filters: buildBackendFilters(table, table.getState().columnFilters, {
        excludeColumnId: columnId,
      }),
      globalFilter: table.getState().globalFilter || undefined,
    }).then((result) => {
      if (!cancelled) setOptions(result?.values ?? getColumnOptions(table, columnId))
    }).finally(() => {
      if (!cancelled) setIsLoading(false)
    })

    return () => {
      cancelled = true
    }
  }, [columnId, enabled, table])

  return { options, isLoading }
}

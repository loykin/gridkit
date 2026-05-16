import { useEffect, useRef } from 'react'
import type { DataStore } from '../store/DataStore'

export function useBackendCapabilitiesWarning<T>({
  enabled,
  dataStore,
  enableSorting,
  enableMultiSort,
  enablePagination,
  hasColumnFilters,
  hasGlobalFilter,
}: {
  enabled: boolean
  dataStore?: DataStore<T>
  enableSorting: boolean
  enableMultiSort: boolean
  enablePagination: boolean
  hasColumnFilters: boolean
  hasGlobalFilter: boolean
}) {
  const lastWarningRef = useRef('')

  useEffect(() => {
    if (!enabled || !dataStore || typeof console === 'undefined') return

    const capabilities = dataStore.getBackendCapabilities()
    if (!capabilities) return

    const missing: string[] = []
    if (enableSorting && capabilities.sorting === false) missing.push('sorting')
    if (enableMultiSort && capabilities.multiSort === false) missing.push('multiSort')
    if (enablePagination && capabilities.pagination === false) missing.push('pagination')
    if (hasColumnFilters && capabilities.filtering === false) missing.push('filtering')
    if (hasGlobalFilter && capabilities.globalSearch === false) missing.push('globalSearch')

    if (missing.length > 0) {
      const key = missing.join(',')
      if (lastWarningRef.current === key) return
      lastWarningRef.current = key
      console.warn(
        `[GridKit] queryMode="backend" is using unsupported backend capabilities: ${missing.join(', ')}.`,
      )
    } else {
      lastWarningRef.current = ''
    }
  }, [
    dataStore,
    enableMultiSort,
    enablePagination,
    enableSorting,
    enabled,
    hasColumnFilters,
    hasGlobalFilter,
  ])
}

import { useEffect, useMemo } from 'react'
import { createDataStore, type DataStore, type DataStoreOptions } from './DataStore'

export interface UseDataStoreOptions<T> extends DataStoreOptions<T> {
  closeOnUnmount?: boolean
}

/**
 * Creates and memoizes a DataStore instance for use with <DataGrid dataStore={store} />.
 *
 * The store is stable for the lifetime of the component — pass a stable `getRowId`
 * callback (e.g. defined outside render or wrapped in useCallback).
 *
 * @example
 * // Basic usage
 * const store = useDataStore<Pod>({ getRowId: p => p.name })
 *
 * @example
 * // Ring buffer for log streaming (keeps latest 5000 rows in memory)
 * const store = useDataStore<LogEntry>({ getRowId: l => l.id, maxSize: 5000 })
 *
 * @example
 * // With a persistence backend
 * const store = useDataStore<AuditEvent>({ getRowId: e => e.id, backend: myBackend })
 */
export function useDataStore<T>(options: UseDataStoreOptions<T>): DataStore<T> {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const store = useMemo(() => createDataStore<T>(options), [])

  useEffect(() => {
    if (!options.closeOnUnmount) return undefined
    return () => store.dispose()
    // The store is intentionally stable for the component lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store])

  return store
}

import { useMemo } from 'react'
import { createDataStore, type DataStore } from './DataStore'

interface UseDataStoreOptions<T> {
  getRowId: (item: T, index: number) => string
}

/**
 * Creates and memoizes a DataStore instance for use with <DataGrid dataStore={store} />.
 *
 * The store is stable for the lifetime of the component — pass a stable `getRowId`
 * callback (e.g. defined outside render or wrapped in useCallback).
 *
 * @example
 * const store = useDataStore<Pod>({ getRowId: p => p.name })
 *
 * useEffect(() => {
 *   const watcher = watchPods(namespace, {
 *     onAdded:    pod  => store.applyTransaction({ add: [pod] }),
 *     onModified: pod  => store.applyTransaction({ update: [{ id: pod.name, data: pod }] }),
 *     onDeleted:  name => store.applyTransaction({ remove: [name] }),
 *   })
 *   return () => watcher.stop()
 * }, [namespace])
 */
export function useDataStore<T>(options: UseDataStoreOptions<T>): DataStore<T> {
  const { getRowId } = options
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(() => createDataStore<T>(getRowId), [])
}

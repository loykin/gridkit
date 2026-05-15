import { useSyncExternalStore } from 'react'
import type { DataStore, DataStoreQueryState } from './DataStore'

const noopSubscribe = (_listener: () => void) => () => {}

const idleQueryState: DataStoreQueryState = {
  isHydrating: false,
  isQuerying: false,
  error: null,
  total: 0,
  version: 0,
  lastQueryMs: null,
  lastUpdatedAt: null,
}

export function useDataStoreQueryState<T>(dataStore?: DataStore<T>): DataStoreQueryState {
  return useSyncExternalStore(
    dataStore ? dataStore.subscribeQueryState : noopSubscribe,
    dataStore ? dataStore.getQueryState : () => idleQueryState,
    () => idleQueryState,
  )
}

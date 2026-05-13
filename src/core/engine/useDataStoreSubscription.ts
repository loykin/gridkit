import { useSyncExternalStore } from 'react'
import type { DataStore } from './DataStore'

const noopSubscribe = (_listener: () => void) => () => {}
const noopGetVersion = () => 0

export function useDataStoreSubscription<T>(dataStore?: DataStore<T>) {
  useSyncExternalStore(
    dataStore ? dataStore.subscribe : noopSubscribe,
    dataStore ? dataStore.getVersion : noopGetVersion,
  )
}

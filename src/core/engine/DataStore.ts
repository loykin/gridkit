import type { DataStoreBackend, QueryParams } from './backends/DataStoreBackend'

export interface Transaction<T> {
  add?: T[]
  update?: Array<{ id: string; data: Partial<T> }>
  remove?: string[]
  /**
   * If true and a backend is configured, persists added rows via backend.append().
   * No-op when no backend is set.
   */
  persist?: boolean
}

export interface DataStoreOptions<T> {
  getRowId: (item: T, index: number) => string
  /**
   * Maximum number of rows to keep in memory.
   * When exceeded, the oldest rows are evicted (FIFO).
   * Useful for unbounded append-only streams (e.g. log tailing).
   */
  maxSize?: number
  /**
   * Optional persistence backend (e.g. IndexedDB, REST API).
   * When set, hydrate() / query() delegate to the backend and
   * applyTransaction({ persist: true }) calls backend.append().
   */
  backend?: DataStoreBackend<T>
}

export interface DataStore<T> {
  get(id: string): T | undefined
  /** Returns a stable array reference — same reference until the next transaction */
  getSnapshot(): T[]
  /** Monotonically increasing integer — increments on every transaction */
  getVersion(): number
  applyTransaction(tx: Transaction<T>): void
  /** useSyncExternalStore compatible subscribe */
  subscribe(listener: () => void): () => void
  /**
   * Load initial data from backend into the store.
   * No-op if no backend is configured.
   */
  hydrate(params?: QueryParams<T>): Promise<void>
  /**
   * Re-query backend and replace the current in-memory window.
   * No-op if no backend is configured.
   */
  query(params: QueryParams<T>): Promise<void>
  /**
   * Total row count: backend total when a backend is set,
   * otherwise the current in-memory map size.
   */
  getTotalCount(): number
}

export function createDataStore<T>(options: DataStoreOptions<T>): DataStore<T> {
  const { getRowId, maxSize, backend } = options

  const map = new Map<string, T>()
  const orderedIds: string[] = []
  const listeners = new Set<() => void>()
  let version = 0
  let backendTotal = 0

  let cachedSnapshot: T[] = []
  let cachedSnapshotVersion = -1

  function notify() {
    version++
    listeners.forEach((fn) => fn())
  }

  function trimToMaxSize() {
    if (maxSize === undefined) return
    while (orderedIds.length > maxSize) {
      const oldest = orderedIds.shift()!
      map.delete(oldest)
    }
  }

  function replaceAll(rows: T[]) {
    map.clear()
    orderedIds.length = 0
    rows.forEach((item, i) => {
      const id = getRowId(item, i)
      map.set(id, item)
      orderedIds.push(id)
    })
  }

  return {
    get: (id) => map.get(id),

    getSnapshot: () => {
      if (cachedSnapshotVersion !== version) {
        cachedSnapshot = orderedIds.map((id) => map.get(id)!)
        cachedSnapshotVersion = version
      }
      return cachedSnapshot
    },

    getVersion: () => version,

    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    applyTransaction: (tx) => {
      let changed = false
      const toAppend: T[] = []

      tx.add?.forEach((item, i) => {
        const id = getRowId(item, map.size + i)
        if (!map.has(id)) {
          map.set(id, item)
          orderedIds.push(id)
          changed = true
          if (tx.persist) toAppend.push(item)
        }
      })

      if (maxSize !== undefined && changed) trimToMaxSize()

      tx.update?.forEach(({ id, data }) => {
        if (map.has(id)) {
          map.set(id, { ...map.get(id)!, ...data })
          changed = true
        }
      })

      tx.remove?.forEach((id) => {
        if (map.delete(id)) {
          const idx = orderedIds.indexOf(id)
          if (idx !== -1) orderedIds.splice(idx, 1)
          changed = true
        }
      })

      if (changed) notify()

      if (toAppend.length > 0 && backend) {
        backend.append(toAppend)
      }
    },

    hydrate: async (params = {}) => {
      if (!backend) return
      const result = await backend.hydrate(params)
      replaceAll(result.rows)
      backendTotal = result.total
      notify()
    },

    query: async (params) => {
      if (!backend) return
      const result = await backend.query(params)
      replaceAll(result.rows)
      backendTotal = result.total
      notify()
    },

    getTotalCount: () => (backend ? backendTotal : map.size),
  }
}

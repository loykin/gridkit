import type {
  BackendTransactionResult,
  DataStoreBackendCapabilities,
  DataStoreBackend,
  FacetParams,
  FacetResult,
  QueryParams,
} from './DataStoreBackend'

export interface DataStoreQueryState {
  isHydrating: boolean
  isQuerying: boolean
  error: Error | null
  total: number
  version: number
  lastQueryMs: number | null
  lastUpdatedAt: number | null
}

export interface Transaction<T> {
  add?: T[]
  update?: Array<{ id: string; data: Partial<T> }>
  remove?: string[]
  /**
   * If true and a backend is configured, persists the mutation via backend.applyTransaction().
   * No-op when no backend is set.
   */
  persist?: boolean
}

export interface TransactionResult {
  ok: boolean
  affected: number
  error?: Error
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
   * applyTransaction({ persist: true }) calls backend.applyTransaction().
   */
  backend?: DataStoreBackend<T>
}

export interface DataStore<T> {
  get(id: string): T | undefined
  /** Returns a stable array reference — same reference until the next transaction */
  getSnapshot(): T[]
  /** Monotonically increasing integer — increments on every transaction */
  getVersion(): number
  getQueryState(): DataStoreQueryState
  applyTransaction(tx: Transaction<T>): void
  applyTransactionAsync(tx: Transaction<T>): Promise<TransactionResult>
  /** useSyncExternalStore compatible subscribe */
  subscribe(listener: () => void): () => void
  subscribeQueryState(listener: () => void): () => void
  /**
   * Load initial data from backend into the store.
   * No-op if no backend is configured.
   */
  hydrate(params?: QueryParams): Promise<void>
  /**
   * Re-query backend and replace the current in-memory window.
   * No-op if no backend is configured.
   */
  query(params: QueryParams): Promise<void>
  getFacets(params: FacetParams): Promise<FacetResult | undefined>
  hasBackendFacets(): boolean
  getBackendCapabilities(): DataStoreBackendCapabilities | undefined
  /**
   * Total row count: backend total when a backend is set,
   * otherwise the current in-memory map size.
   */
  getTotalCount(): number
  reset(): void
  clear(): Promise<void>
  dispose(): void
}

export function createDataStore<T>(options: DataStoreOptions<T>): DataStore<T> {
  const { getRowId, maxSize, backend } = options

  const map = new Map<string, T>()
  const orderedIds: string[] = []
  const listeners = new Set<() => void>()
  const queryStateListeners = new Set<() => void>()
  let version = 0
  let backendTotal = 0
  let querySequence = 0
  let queryState: DataStoreQueryState = {
    isHydrating: false,
    isQuerying: false,
    error: null,
    total: 0,
    version: 0,
    lastQueryMs: null,
    lastUpdatedAt: null,
  }

  let cachedSnapshot: T[] = []
  let cachedSnapshotVersion = -1

  function notify() {
    version++
    listeners.forEach((fn) => fn())
  }

  function notifyQueryState(patch: Partial<DataStoreQueryState>) {
    queryState = {
      ...queryState,
      ...patch,
      version: queryState.version + 1,
    }
    queryStateListeners.forEach((fn) => fn())
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

  function resetMemory() {
    map.clear()
    orderedIds.length = 0
    backendTotal = 0
    notify()
    notifyQueryState({ total: 0, error: null, lastUpdatedAt: Date.now() })
  }

  function applyTransactionCore(tx: Transaction<T>) {
    let affected = 0
    let added = 0
    let removed = 0

    tx.add?.forEach((item, i) => {
      const id = getRowId(item, map.size + i)
      if (!map.has(id)) {
        map.set(id, item)
        orderedIds.push(id)
        affected++
        added++
      }
    })

    if (maxSize !== undefined && affected > 0) trimToMaxSize()

    tx.update?.forEach(({ id, data }) => {
      if (map.has(id)) {
        map.set(id, { ...map.get(id)!, ...data })
        affected++
      }
    })

    tx.remove?.forEach((id) => {
      if (map.delete(id)) {
        const idx = orderedIds.indexOf(id)
        if (idx !== -1) orderedIds.splice(idx, 1)
        affected++
        removed++
      }
    })

    if (affected > 0) {
      backendTotal = backend ? Math.max(0, backendTotal + added - removed) : map.size
      notify()
      notifyQueryState({ total: backend ? backendTotal : map.size, error: null, lastUpdatedAt: Date.now() })
    }

    return { affected }
  }

  async function runQuery(kind: 'hydrate' | 'query', params: QueryParams) {
    if (!backend) return
    if (kind === 'hydrate' && !backend.hydrate) return

    const sequence = ++querySequence
    const startedAt = performance.now()
    notifyQueryState({
      isHydrating: kind === 'hydrate',
      isQuerying: kind === 'query',
      error: null,
    })

    try {
      const result = kind === 'hydrate'
        ? await backend.hydrate!(params)
        : await backend.query(params)
      if (sequence !== querySequence) return

      replaceAll(result.rows)
      backendTotal = result.total
      notify()
      notifyQueryState({
        isHydrating: false,
        isQuerying: false,
        error: null,
        total: result.total,
        lastQueryMs: performance.now() - startedAt,
        lastUpdatedAt: Date.now(),
      })
    } catch (error) {
      if (sequence !== querySequence) return
      notifyQueryState({
        isHydrating: false,
        isQuerying: false,
        error: error instanceof Error ? error : new Error(String(error)),
        lastQueryMs: performance.now() - startedAt,
      })
    }
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

    getQueryState: () => queryState,

    subscribe: (listener) => {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },

    subscribeQueryState: (listener) => {
      queryStateListeners.add(listener)
      return () => queryStateListeners.delete(listener)
    },

    applyTransaction: (tx) => {
      applyTransactionCore(tx)

      if (tx.persist && backend?.applyTransaction) {
        void backend.applyTransaction(tx)
      }
    },

    applyTransactionAsync: async (tx) => {
      try {
        let backendResult: BackendTransactionResult | void = undefined
        if (tx.persist && backend?.applyTransaction) {
          backendResult = await backend.applyTransaction(tx)
        }
        if (backendResult && !backendResult.ok) {
          return {
            ok: false,
            affected: backendResult.affected,
            error: backendResult.error,
          }
        }
        const { affected } = applyTransactionCore(tx)
        return { ok: true, affected }
      } catch (error) {
        return {
          ok: false,
          affected: 0,
          error: error instanceof Error ? error : new Error(String(error)),
        }
      }
    },

    hydrate: (params = {}) => runQuery('hydrate', params),

    query: (params) => runQuery('query', params),

    getFacets: (params) => backend?.getFacets?.(params) ?? Promise.resolve(undefined),

    hasBackendFacets: () => !!backend?.getFacets,

    getBackendCapabilities: () => backend?.capabilities,

    getTotalCount: () => (backend ? backendTotal : map.size),

    reset: resetMemory,

    clear: async () => {
      await backend?.clear?.()
      resetMemory()
    },

    dispose: () => {
      querySequence++
      backend?.close?.()
      queryStateListeners.clear()
      listeners.clear()
    },
  }
}

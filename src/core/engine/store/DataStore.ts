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
  /**
   * Optional post-processing hook for backend rows before they enter the store.
   * Receives the previous row with the same id so callers can preserve object
   * references for unchanged derived rows.
   */
  transformRow?: (row: T, previous: T | undefined) => T
  /**
   * Backend facet cache. Intended for "same other filters => same facets" UI
   * lookups while a filter popover is open.
   */
  facetCache?: boolean | {
    strategy?: 'by-other-filters'
    maxEntries?: number
  }
  /**
   * Gate backend hydrate/query calls until an external backend is ready.
   */
  ready?: boolean
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
  /**
   * Re-run the latest backend query params. No-op before query() has been called.
   */
  refetch(): Promise<void>
  setReady(ready: boolean): void
  isReady(): boolean
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
  const { getRowId, maxSize, backend, transformRow } = options

  const map = new Map<string, T>()
  const orderedIds: string[] = []
  const listeners = new Set<() => void>()
  const queryStateListeners = new Set<() => void>()
  let version = 0
  let backendTotal = 0
  let querySequence = 0
  let ready = options.ready ?? true
  let latestQueryParams: QueryParams | undefined
  let pendingQuery: {
    kind: 'hydrate' | 'query'
    params: QueryParams
    resolve: () => void
  } | undefined
  const facetCache = options.facetCache ? new Map<string, FacetResult | undefined>() : undefined
  const facetCacheMaxEntries = typeof options.facetCache === 'object' ? options.facetCache.maxEntries ?? 100 : 100
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

  function stableStringify(value: unknown): string {
    if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`
    if (value && typeof value === 'object') {
      return `{${Object.keys(value).sort().map((key) => {
        const record = value as Record<string, unknown>
        return `${JSON.stringify(key)}:${stableStringify(record[key])}`
      }).join(',')}}`
    }
    return JSON.stringify(value)
  }

  function getFacetCacheKey(params: FacetParams) {
    return stableStringify(params)
  }

  function clearFacetCache() {
    facetCache?.clear()
  }

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
    const previous = new Map(map)
    map.clear()
    orderedIds.length = 0
    rows.forEach((item, i) => {
      const id = getRowId(item, i)
      map.set(id, transformRow ? transformRow(item, previous.get(id)) : item)
      orderedIds.push(id)
    })
  }

  function resetMemory() {
    clearFacetCache()
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
      clearFacetCache()
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

  function enqueueQuery(kind: 'hydrate' | 'query', params: QueryParams) {
    pendingQuery?.resolve()
    return new Promise<void>((resolve) => {
      pendingQuery = { kind, params, resolve }
    })
  }

  function flushPendingQuery() {
    if (!ready || !pendingQuery) return
    const pending = pendingQuery
    pendingQuery = undefined
    void runQuery(pending.kind, pending.params).then(pending.resolve)
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

    hydrate: (params = {}) => {
      if (!ready) return enqueueQuery('hydrate', params)
      return runQuery('hydrate', params)
    },

    query: (params) => {
      latestQueryParams = params
      if (!ready) return enqueueQuery('query', params)
      return runQuery('query', params)
    },

    refetch: () => {
      if (!latestQueryParams) return Promise.resolve()
      if (!ready) return enqueueQuery('query', latestQueryParams)
      return runQuery('query', latestQueryParams)
    },

    setReady: (nextReady) => {
      ready = nextReady
      flushPendingQuery()
    },

    isReady: () => ready,

    getFacets: async (params) => {
      if (!backend?.getFacets) return undefined
      if (!facetCache) return backend.getFacets(params)

      const key = getFacetCacheKey(params)
      if (facetCache.has(key)) return facetCache.get(key)

      const result = await backend.getFacets(params)
      facetCache.set(key, result)
      if (facetCache.size > facetCacheMaxEntries) {
        const oldestKey = facetCache.keys().next().value
        if (oldestKey) facetCache.delete(oldestKey)
      }
      return result
    },

    hasBackendFacets: () => !!backend?.getFacets,

    getBackendCapabilities: () => backend?.capabilities,

    getTotalCount: () => (backend ? backendTotal : map.size),

    reset: resetMemory,

    clear: async () => {
      await backend?.clear?.()
      clearFacetCache()
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

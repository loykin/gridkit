export interface Transaction<T> {
  add?: T[]
  update?: Array<{ id: string; data: Partial<T> }>
  remove?: string[]
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
}

export function createDataStore<T>(getRowId: (item: T, index: number) => string): DataStore<T> {
  const map = new Map<string, T>()
  const orderedIds: string[] = []
  const listeners = new Set<() => void>()
  let version = 0

  // Stable snapshot — recreated only when version changes
  let cachedSnapshot: T[] = []
  let cachedSnapshotVersion = -1

  function notify() {
    version++
    listeners.forEach((fn) => fn())
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

      tx.add?.forEach((item, i) => {
        const id = getRowId(item, map.size + i)
        if (!map.has(id)) {
          map.set(id, item)
          orderedIds.push(id)
          changed = true
        }
      })

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
    },
  }
}

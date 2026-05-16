import { describe, expect, it, vi } from 'vitest'
import { createDataStore } from '../DataStore'
import type { DataStoreBackend } from '../DataStoreBackend'

interface Row {
  id: string
  name: string
}

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (error: Error) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

describe('DataStore', () => {
  it('tracks query lifecycle state', async () => {
    const backend: DataStoreBackend<Row> = {
      query: vi.fn(async () => ({ rows: [{ id: '1', name: 'Ada' }], total: 1 })),
    }
    const store = createDataStore<Row>({ getRowId: (row) => row.id, backend })
    const states: boolean[] = []
    store.subscribeQueryState(() => states.push(store.getQueryState().isQuerying))

    await store.query({ filters: [{ field: 'name', op: 'like', value: 'Ada' }] })

    expect(backend.query).toHaveBeenCalledWith({
      filters: [{ field: 'name', op: 'like', value: 'Ada' }],
    })
    expect(states).toEqual([true, false])
    expect(store.getSnapshot()).toEqual([{ id: '1', name: 'Ada' }])
    expect(store.getQueryState()).toMatchObject({
      isQuerying: false,
      error: null,
      total: 1,
    })
    expect(store.getQueryState().lastQueryMs).not.toBeNull()
  })

  it('discards stale query results', async () => {
    const slow = deferred<{ rows: Row[]; total: number }>()
    const fast = deferred<{ rows: Row[]; total: number }>()
    const backend: DataStoreBackend<Row> = {
      query: vi.fn()
        .mockReturnValueOnce(slow.promise)
        .mockReturnValueOnce(fast.promise),
    }
    const store = createDataStore<Row>({ getRowId: (row) => row.id, backend })

    const slowQuery = store.query({ globalFilter: 'slow' })
    const fastQuery = store.query({ globalFilter: 'fast' })

    fast.resolve({ rows: [{ id: '2', name: 'Fast' }], total: 1 })
    await fastQuery
    slow.resolve({ rows: [{ id: '1', name: 'Slow' }], total: 1 })
    await slowQuery

    expect(store.getSnapshot()).toEqual([{ id: '2', name: 'Fast' }])
  })

  it('returns async transaction persistence failures', async () => {
    const error = new Error('write failed')
    const backend: DataStoreBackend<Row> = {
      query: vi.fn(async () => ({ rows: [], total: 0 })),
      applyTransaction: vi.fn(async () => {
        throw error
      }),
    }
    const store = createDataStore<Row>({ getRowId: (row) => row.id, backend })

    const result = await store.applyTransactionAsync({
      add: [{ id: '1', name: 'Ada' }],
      persist: true,
    })

    expect(result).toEqual({ ok: false, affected: 0, error })
    expect(store.getSnapshot()).toEqual([])
  })

  it('applies async transactions after backend persistence succeeds', async () => {
    const backend: DataStoreBackend<Row> = {
      query: vi.fn(async () => ({ rows: [], total: 0 })),
      applyTransaction: vi.fn(async () => ({ ok: true, affected: 1 })),
    }
    const store = createDataStore<Row>({ getRowId: (row) => row.id, backend })

    const result = await store.applyTransactionAsync({
      add: [{ id: '1', name: 'Ada' }],
      persist: true,
    })

    expect(result).toEqual({ ok: true, affected: 1 })
    expect(store.getSnapshot()).toEqual([{ id: '1', name: 'Ada' }])
  })

  it('delegates optional facets and lifecycle methods', async () => {
    const backend: DataStoreBackend<Row> = {
      query: vi.fn(async () => ({ rows: [], total: 0 })),
      getFacets: vi.fn(async () => ({ values: ['Ada'] })),
      clear: vi.fn(async () => {}),
      close: vi.fn(),
    }
    const store = createDataStore<Row>({ getRowId: (row) => row.id, backend })

    expect(await store.getFacets({ field: 'name', limit: 10 })).toEqual({ values: ['Ada'] })
    await store.clear()
    store.dispose()

    expect(backend.getFacets).toHaveBeenCalledWith({ field: 'name', limit: 10 })
    expect(backend.clear).toHaveBeenCalled()
    expect(backend.close).toHaveBeenCalled()
  })
})

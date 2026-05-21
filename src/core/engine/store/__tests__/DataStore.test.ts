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

  it('refetches the latest backend query params', async () => {
    const backend: DataStoreBackend<Row> = {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [{ id: '1', name: 'Ada' }], total: 1 })
        .mockResolvedValueOnce({ rows: [{ id: '2', name: 'Grace' }], total: 1 }),
    }
    const params = { globalFilter: 'engineer' }
    const store = createDataStore<Row>({ getRowId: (row) => row.id, backend })

    await store.query(params)
    await store.refetch()

    expect(backend.query).toHaveBeenCalledTimes(2)
    expect(backend.query).toHaveBeenLastCalledWith(params)
    expect(store.getSnapshot()).toEqual([{ id: '2', name: 'Grace' }])
  })

  it('queues backend queries until the store is ready', async () => {
    const backend: DataStoreBackend<Row> = {
      query: vi.fn(async () => ({ rows: [{ id: '1', name: 'Ada' }], total: 1 })),
    }
    const store = createDataStore<Row>({ getRowId: (row) => row.id, backend, ready: false })

    const query = store.query({ globalFilter: 'Ada' })

    expect(store.isReady()).toBe(false)
    expect(backend.query).not.toHaveBeenCalled()

    store.setReady(true)
    await query

    expect(store.isReady()).toBe(true)
    expect(backend.query).toHaveBeenCalledWith({ globalFilter: 'Ada' })
    expect(store.getSnapshot()).toEqual([{ id: '1', name: 'Ada' }])
  })

  it('transforms backend rows with access to previous rows', async () => {
    const previousRow = { id: '1', name: 'Ada' }
    const backend: DataStoreBackend<Row> = {
      query: vi.fn()
        .mockResolvedValueOnce({ rows: [previousRow], total: 1 })
        .mockResolvedValueOnce({ rows: [{ id: '1', name: 'Ada' }], total: 1 }),
    }
    const transformRow = vi.fn((row: Row, previous: Row | undefined) => (
      previous && previous.name === row.name.toUpperCase() ? previous : { ...row, name: row.name.toUpperCase() }
    ))
    const store = createDataStore<Row>({ getRowId: (row) => row.id, backend, transformRow })

    await store.query({})
    expect(store.getSnapshot()).toEqual([{ id: '1', name: 'ADA' }])
    const firstTransformedRow = store.getSnapshot()[0]

    await store.query({})
    expect(transformRow).toHaveBeenLastCalledWith({ id: '1', name: 'Ada' }, firstTransformedRow)
    expect(store.getSnapshot()[0]).toBe(firstTransformedRow)
  })

  it('caches backend facets by params', async () => {
    const backend: DataStoreBackend<Row> = {
      query: vi.fn(async () => ({ rows: [], total: 0 })),
      getFacets: vi.fn(async () => ({ values: ['Ada'], hasEmpty: true })),
    }
    const store = createDataStore<Row>({
      getRowId: (row) => row.id,
      backend,
      facetCache: { strategy: 'by-other-filters' },
    })
    const params = { field: 'name', filters: [{ field: 'role', op: 'eq' as const, value: 'admin' }] }

    await expect(store.getFacets(params)).resolves.toEqual({ values: ['Ada'], hasEmpty: true })
    await expect(store.getFacets({ filters: params.filters, field: 'name' })).resolves.toEqual({
      values: ['Ada'],
      hasEmpty: true,
    })

    expect(backend.getFacets).toHaveBeenCalledTimes(1)
  })
})

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import type { GridKitTableDef, GridKitTablePayload, GridKitQueryPrepare, GridKitQueryExecutor } from '@/types'
import type { GridKitAutoTableProps } from './GridKitAutoTable'
import { GridKitAutoTable } from './GridKitAutoTable'
import { inferTablePayload, type InferTablePayloadOptions } from './core/utils/inferTablePayload'
import { createDataStore } from './core/engine/store/DataStore'
import type { DataStoreBackend, QueryParams, QueryResult } from './core/engine/store/DataStoreBackend'

type Row = Record<string, unknown>

export interface GridKitTableProps<TQuery = unknown>
  extends Omit<GridKitAutoTableProps, 'payload' | 'dataStore' | 'queryMode'> {
  def: GridKitTableDef<TQuery>
  executor: GridKitQueryExecutor<TQuery>
  /** Optional transform applied to the query before execution. */
  prepare?: GridKitQueryPrepare<TQuery>
  /** Options forwarded to inferTablePayload (e.g. per-column hints). */
  inferOptions?: Omit<InferTablePayloadOptions, 'title'>
  /**
   * Identifies the query for cache/store invalidation purposes. When it
   * changes, the internal DataStore is torn down and recreated from
   * scratch. Defaults to a stable stringify of `def` — set this explicitly
   * when `def.query` can't be safely stringified (functions, cycles, etc).
   */
  queryKey?: unknown[]
  renderLoading?: () => ReactNode
  renderError?: (error: unknown) => ReactNode
}

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

export function GridKitTable<TQuery = unknown>({ queryKey, ...props }: GridKitTableProps<TQuery>) {
  const key = queryKey ? stableStringify(queryKey) : stableStringify(props.def)
  // Remounting on key change gives each query definition its own DataStore
  // instance, since useDataStore-style stores are stable for a component's
  // lifetime and can't be reconfigured after creation.
  return <GridKitTableInner key={key} {...props} />
}

function GridKitTableInner<TQuery = unknown>({
  def,
  executor,
  prepare,
  inferOptions,
  renderLoading,
  renderError,
  ...autoTableProps
}: Omit<GridKitTableProps<TQuery>, 'queryKey'>) {
  const [payload, setPayload] = useState<GridKitTablePayload | null>(null)
  const [error, setError] = useState<unknown>(null)

  const defRef = useRef(def)
  defRef.current = def
  const executorRef = useRef(executor)
  executorRef.current = executor
  const prepareRef = useRef(prepare)
  prepareRef.current = prepare
  const controllerRef = useRef<AbortController | null>(null)

  const store = useMemo(() => {
    const runQuery = (params: QueryParams): Promise<QueryResult<Row>> => {
      controllerRef.current?.abort()
      const controller = new AbortController()
      controllerRef.current = controller
      const query = prepareRef.current
        ? prepareRef.current(defRef.current.query as TQuery, params)
        : (defRef.current.query as TQuery)
      return executorRef.current(query, { signal: controller.signal, params })
        .then((rows) => ({ rows, total: rows.length }))
    }
    const backend: DataStoreBackend<Row> = {
      hydrate: (params) => runQuery(params),
      query: (params) => runQuery(params),
    }
    return createDataStore<Row>({ getRowId: (_row, index) => String(index), backend })
  }, [])

  useEffect(() => {
    return () => {
      controllerRef.current?.abort()
      store.dispose()
    }
  }, [store])

  useEffect(() => {
    let cancelled = false
    // One-time hydrate to learn the row shape and fix the inferred columns.
    // DataGrid's own backend-mode query (triggered once it mounts below)
    // takes over from here for sort/filter/page-driven re-queries.
    store.hydrate({}).then(() => {
      if (cancelled) return
      const queryError = store.getQueryState().error
      if (queryError) {
        setError(queryError)
        return
      }
      setPayload(inferTablePayload(store.getSnapshot(), { title: defRef.current.title, ...inferOptions }))
    })
    return () => { cancelled = true }
  // Runs once per store (i.e. once per queryKey) — inferOptions intentionally
  // isn't a dep since re-inferring columns on every render would thrash them.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store])

  if (error) {
    return renderError ? <>{renderError(error)}</> : null
  }
  if (!payload) {
    return renderLoading ? <>{renderLoading()}</> : null
  }

  return <GridKitAutoTable payload={payload} dataStore={store} queryMode="backend" {...autoTableProps} />
}

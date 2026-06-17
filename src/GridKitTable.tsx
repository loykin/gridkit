import { useEffect, useRef, useState, type ReactNode } from 'react'
import type { GridKitTableDef, GridKitTablePayload, GridKitQueryPrepare, GridKitQueryExecutor } from '@/types'
import type { GridKitAutoTableProps } from './GridKitAutoTable'
import { GridKitAutoTable } from './GridKitAutoTable'
import { inferTablePayload, type InferTablePayloadOptions } from './core/utils/inferTablePayload'

export interface GridKitTableProps<TQuery = unknown>
  extends Omit<GridKitAutoTableProps, 'payload'> {
  def: GridKitTableDef<TQuery>
  executor: GridKitQueryExecutor<TQuery>
  /** Optional transform applied to the query before execution. */
  prepare?: GridKitQueryPrepare<TQuery>
  /** Options forwarded to inferTablePayload (e.g. per-column hints). */
  inferOptions?: Omit<InferTablePayloadOptions, 'title'>
  renderLoading?: () => ReactNode
  renderError?: (error: unknown) => ReactNode
}

export function GridKitTable<TQuery = unknown>({
  def,
  executor,
  prepare,
  inferOptions,
  renderLoading,
  renderError,
  ...autoTableProps
}: GridKitTableProps<TQuery>) {
  const [payload, setPayload] = useState<GridKitTablePayload | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<unknown>(null)

  // Stable ref so effect doesn't re-run when callbacks change identity.
  const executorRef = useRef(executor)
  executorRef.current = executor
  const prepareRef = useRef(prepare)
  prepareRef.current = prepare

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    const query = prepareRef.current
      ? prepareRef.current(def.query as TQuery, {})
      : (def.query as TQuery)

    executorRef.current(query)
      .then((rows) => {
        if (cancelled) return
        setPayload(inferTablePayload(rows, { title: def.title, ...inferOptions }))
        setLoading(false)
      })
      .catch((err) => {
        if (cancelled) return
        setError(err)
        setLoading(false)
      })

    return () => { cancelled = true }
  // Re-fetch when the query definition changes.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(def)])

  if (loading) {
    return renderLoading ? <>{renderLoading()}</> : null
  }
  if (error) {
    return renderError ? <>{renderError(error)}</> : null
  }
  if (!payload) return null

  return <GridKitAutoTable payload={payload} {...autoTableProps} />
}

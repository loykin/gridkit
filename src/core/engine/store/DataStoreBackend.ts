export type FilterOperator =
  | 'eq'
  | 'neq'
  | 'in'
  | 'notIn'
  | 'like'
  | 'startsWith'
  | 'endsWith'
  | 'empty'
  | 'notEmpty'
  | 'range'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'

export interface FilterExpr {
  field: string
  op: FilterOperator
  value?: unknown
}

export interface SortExpr {
  field: string
  desc?: boolean
}

export interface QueryParams {
  filters?: FilterExpr[]
  globalFilter?: string
  sort?: SortExpr[]
  limit?: number
  offset?: number
}

export interface QueryResult<T> {
  rows: T[]
  total: number
}

export interface BackendTransaction<T> {
  add?: T[]
  update?: Array<{ id: string; data: Partial<T> }>
  remove?: string[]
}

export interface BackendTransactionResult {
  ok: boolean
  affected: number
  error?: Error
}

export interface FacetParams {
  field: string
  filters?: FilterExpr[]
  globalFilter?: string
  limit?: number
}

export interface FacetResult {
  values: string[]
  truncated?: boolean
  hasEmpty?: boolean
}

export interface DataStoreBackendCapabilities {
  filtering?: boolean
  sorting?: boolean
  pagination?: boolean
  facets?: boolean
  globalSearch?: boolean
  multiSort?: boolean
}

export interface DataStoreBackend<T> {
  capabilities?: DataStoreBackendCapabilities
  /** Initial load — called when the DataStore mounts. */
  hydrate?(params: QueryParams): Promise<QueryResult<T>>
  /** Persist mutations — called when applyTransaction({ persist: true }) is used. */
  applyTransaction?(tx: BackendTransaction<T>): Promise<BackendTransactionResult | void>
  /** Re-query — called on filter, sort, or page changes. */
  query(params: QueryParams): Promise<QueryResult<T>>
  /** Optional distinct/facet values for backend-driven column filter UIs. */
  getFacets?(params: FacetParams): Promise<FacetResult>
  /** Delete all stored data. */
  clear?(): Promise<void>
  /** Release any open connections or resources. */
  close?(): void
}

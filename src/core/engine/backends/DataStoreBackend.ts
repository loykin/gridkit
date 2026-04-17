export interface QueryParams<T> {
  filter?: Partial<T>
  sort?: { field: keyof T; desc?: boolean }[]
  limit?: number
  offset?: number
}

export interface QueryResult<T> {
  rows: T[]
  total: number
}

export interface DataStoreBackend<T> {
  /** Initial load — called when the DataStore mounts. */
  hydrate(params: QueryParams<T>): Promise<QueryResult<T>>
  /** Persist new rows — called when applyTransaction({ persist: true }) is used. */
  append(rows: T[]): Promise<void>
  /** Re-query — called on filter, sort, or page changes. */
  query(params: QueryParams<T>): Promise<QueryResult<T>>
  /** Delete all stored data. */
  clear(): Promise<void>
  /** Release any open connections or resources. */
  close(): void
}

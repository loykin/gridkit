import React from 'react'
import { createRoot } from 'react-dom/client'
import {
  DataGrid,
  DataGridPaginationBar,
  GlobalSearch,
  useDataStore,
  useDataStoreQueryState,
} from '@loykin/gridkit'
import type { DataGridColumnDef, DataStoreBackend, QueryParams } from '@loykin/gridkit'
import '@loykin/gridkit/styles'

interface Row {
  id: string
  name: string
  status: 'open' | 'done'
}

const rows: Row[] = [
  { id: '1', name: 'Alpha', status: 'open' },
  { id: '2', name: 'Beta', status: 'done' },
]

const backend: DataStoreBackend<Row> = {
  capabilities: {
    filtering: true,
    sorting: true,
    pagination: true,
    globalSearch: true,
    facets: true,
  },
  async query(params: QueryParams) {
    const total = rows.length
    const offset = params.offset ?? 0
    const limit = params.limit ?? total
    return { rows: rows.slice(offset, offset + limit), total }
  },
  async getFacets({ field }) {
    return {
      values: Array.from(new Set(rows.map((row) => String(row[field as keyof Row] ?? '')))),
    }
  },
}

const columns: DataGridColumnDef<Row>[] = [
  { accessorKey: 'name', header: 'Name', meta: { filterType: 'text', backendField: 'name' } },
  { accessorKey: 'status', header: 'Status', meta: { filterType: 'select' } },
]

function App() {
  const store = useDataStore<Row>({ getRowId: (row) => row.id, backend })
  const queryState = useDataStoreQueryState(store)

  return (
    <DataGrid
      dataStore={store}
      queryMode="backend"
      columns={columns}
      enableColumnFilters
      filterDisplay="icon"
      headerLeft={(table) => <GlobalSearch table={table} />}
      pagination={{ pageSize: 1 }}
      footer={(table) => <DataGridPaginationBar table={table} totalCount={queryState.total} />}
    />
  )
}

createRoot(document.getElementById('root')!).render(<App />)

import { useMemo } from 'react'
import {
  DataGrid,
  DataGridPaginationBar,
  GlobalSearch,
  type CustomFilterProps,
  useDataStore,
  useDataStoreQueryState,
} from '@loykin/gridkit'
import {
  auditColumns,
  BACKEND_PAGE_SIZE,
  createFakeAuditBackend,
  generateAuditEvents,
  type AuditEvent,
} from './backendDemo'

function BackendTextFilter({ column, value, onChange, backend }: CustomFilterProps<AuditEvent>) {
  const currentValue = typeof value === 'string' ? value : ''

  return (
    <div className="flex flex-col gap-1">
      <input
        className="h-8 rounded border border-input bg-background px-2 text-xs outline-none focus:border-ring"
        value={currentValue}
        placeholder={`Filter ${backend?.field ?? column.id}`}
        onChange={(event) => onChange(event.target.value || undefined)}
      />
      <span className="text-[10px] text-muted-foreground">
        backend: {backend?.field ?? column.id}
      </span>
    </div>
  )
}

export function BackendTab() {
  const allData = useMemo(() => generateAuditEvents(10_000), [])
  const backend = useMemo(() => createFakeAuditBackend(allData), [allData])
  const store = useDataStore({
    getRowId: (event) => event.id,
    backend,
    facetCache: { strategy: 'by-other-filters', maxEntries: 64 },
  })
  const queryState = useDataStoreQueryState(store)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <button
          type="button"
          className="h-8 rounded border border-input px-3 text-xs hover:bg-muted"
          onClick={() => void store.refetch()}
        >
          Refetch
        </button>
        <div className="ml-auto text-xs text-muted-foreground">
          {queryState.isQuerying ? 'Querying...' : 'Ready'} · Total:{' '}
          <strong className="text-foreground">{queryState.total.toLocaleString()}</strong> records
          {queryState.lastQueryMs != null && (
            <> · {Math.round(queryState.lastQueryMs)}ms</>
          )}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">queryMode=&quot;backend&quot;</code>{' '}
        connects grid sorting, header filters, global search, and pagination to{' '}
        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">DataStoreBackend.query()</code>.
        The grid holds only the current page while the backend receives typed query params.
      </p>

      <DataGrid
        dataStore={store}
        queryMode="backend"
        columns={auditColumns}
        headerLeft={(table) => <GlobalSearch table={table} placeholder="Search audit events..." />}
        pagination={{ pageSize: BACKEND_PAGE_SIZE }}
        footer={(table) => <DataGridPaginationBar table={table} className="pt-2" totalCount={queryState.total} />}
        enableColumnFilters
        filterDisplay="icon"
        customFilterComponents={{ text: BackendTextFilter }}
        enableMultiSort
        tableHeight={460}
        emptyMessage="No records found"
        tableKey="backend-demo"
      />
    </section>
  )
}

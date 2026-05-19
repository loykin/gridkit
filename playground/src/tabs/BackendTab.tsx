import { useMemo } from 'react'
import {
  DataGrid,
  DataGridPaginationBar,
  GlobalSearch,
  useDataStore,
  useDataStoreQueryState,
} from '@loykin/gridkit'
import {
  auditColumns,
  BACKEND_PAGE_SIZE,
  createFakeAuditBackend,
  generateAuditEvents,
} from './backendDemo'

export function BackendTab() {
  const allData = useMemo(() => generateAuditEvents(10_000), [])
  const backend = useMemo(() => createFakeAuditBackend(allData), [allData])
  const store = useDataStore({ getRowId: (event) => event.id, backend })
  const queryState = useDataStoreQueryState(store)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
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
        enableMultiSort
        tableHeight={460}
        emptyMessage="No records found"
        tableKey="backend-demo"
      />
    </section>
  )
}

import { useEffect, useMemo, useRef, useState } from 'react'
import { DataGrid, useDataStore } from '@loykin/gridkit'
import type { DataGridColumnDef, DataStoreBackend, QueryParams } from '@loykin/gridkit'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuditEvent {
  id: string
  timestamp: string
  user: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ'
  resource: string
  namespace: string
  status: 'success' | 'denied'
}

// ── Fake backend ──────────────────────────────────────────────────────────────

const USERS = ['alice', 'bob', 'carol', 'dave', 'eve', 'frank']
const RESOURCES = ['Pod', 'Deployment', 'Service', 'ConfigMap', 'Secret', 'Ingress']
const NAMESPACES = ['default', 'kube-system', 'monitoring', 'prod', 'staging']

function generateAuditEvents(count: number): AuditEvent[] {
  const base = new Date('2024-01-01').getTime()
  return Array.from({ length: count }, (_, i) => {
    const roll = Math.random()
    return {
      id: String(i + 1),
      timestamp: new Date(base + i * 30_000).toISOString().slice(0, 19).replace('T', ' '),
      user: USERS[Math.floor(Math.random() * USERS.length)]!,
      action: (roll < 0.5 ? 'READ' : roll < 0.7 ? 'UPDATE' : roll < 0.85 ? 'CREATE' : 'DELETE') as AuditEvent['action'],
      resource: RESOURCES[Math.floor(Math.random() * RESOURCES.length)]!,
      namespace: NAMESPACES[Math.floor(Math.random() * NAMESPACES.length)]!,
      status: Math.random() < 0.9 ? 'success' : 'denied',
    }
  })
}

function applyQuery(
  data: AuditEvent[],
  params: QueryParams<AuditEvent>,
): { rows: AuditEvent[]; total: number } {
  let result = data

  if (params.filter) {
    const entries = Object.entries(params.filter).filter(([, v]) => v !== undefined) as [
      keyof AuditEvent,
      unknown,
    ][]
    if (entries.length > 0) {
      result = data.filter((item) => entries.every(([k, v]) => item[k] === v))
    }
  }

  const total = result.length
  const limit = params.limit ?? 20
  const offset = params.offset ?? 0

  return { rows: result.slice(offset, offset + limit), total }
}

function createFakeAuditBackend(data: AuditEvent[]): DataStoreBackend<AuditEvent> {
  const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms))

  return {
    hydrate: async (params) => { await delay(150); return applyQuery(data, params) },
    append: async () => {},
    query: async (params) => { await delay(150); return applyQuery(data, params) },
    clear: async () => {},
    close: () => {},
  }
}

// ── Columns ───────────────────────────────────────────────────────────────────

const ACTION_STYLE: Record<AuditEvent['action'], string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  READ: 'bg-muted text-muted-foreground',
}

const columns: DataGridColumnDef<AuditEvent>[] = [
  { accessorKey: 'timestamp', header: 'Timestamp', meta: { width: 160 } },
  { accessorKey: 'user', header: 'User', meta: { flex: 1 } },
  {
    accessorKey: 'action',
    header: 'Action',
    meta: { width: 90 },
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_STYLE[row.original.action]}`}
      >
        {row.original.action}
      </span>
    ),
  },
  { accessorKey: 'resource', header: 'Resource', meta: { flex: 1 } },
  { accessorKey: 'namespace', header: 'Namespace', meta: { flex: 1 } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { width: 80 },
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
          row.original.status === 'success'
            ? 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
            : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
        }`}
      >
        {row.original.status}
      </span>
    ),
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

type ActionFilter = AuditEvent['action'] | undefined
type StatusFilter = AuditEvent['status'] | undefined

const PAGE_SIZE = 20

export function BackendTab() {
  const allData = useMemo(() => generateAuditEvents(10_000), [])
  const backend = useMemo(() => createFakeAuditBackend(allData), [allData])
  const store = useDataStore<AuditEvent>({ getRowId: (e) => e.id, backend })

  const [isLoading, setIsLoading] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [actionFilter, setActionFilter] = useState<ActionFilter>(undefined)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined)
  const [gridKey, setGridKey] = useState(0)

  // Ref for current filter — used inside onPageChange closure without staleness
  const filterRef = useRef<Partial<AuditEvent>>({})

  async function runQuery(params: QueryParams<AuditEvent>) {
    setIsLoading(true)
    await store.query(params)
    setTotalCount(store.getTotalCount())
    setIsLoading(false)
  }

  useEffect(() => {
    store.hydrate({ limit: PAGE_SIZE, offset: 0 }).then(() => {
      setTotalCount(store.getTotalCount())
      setIsLoading(false)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function handleActionFilter(action: ActionFilter) {
    const filter = { ...filterRef.current }
    if (action) filter.action = action
    else delete filter.action
    filterRef.current = filter
    setActionFilter(action)
    setGridKey((k) => k + 1)
    runQuery({ limit: PAGE_SIZE, offset: 0, filter })
  }

  function handleStatusFilter(status: StatusFilter) {
    const filter = { ...filterRef.current }
    if (status) filter.status = status
    else delete filter.status
    filterRef.current = filter
    setStatusFilter(status)
    setGridKey((k) => k + 1)
    runQuery({ limit: PAGE_SIZE, offset: 0, filter })
  }

  return (
    <section className="flex flex-col gap-4">
      {/* Filter controls */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Action</span>
          {([undefined, 'CREATE', 'UPDATE', 'DELETE', 'READ'] as ActionFilter[]).map((a) => (
            <button
              key={a ?? 'all'}
              onClick={() => handleActionFilter(a)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                actionFilter === a
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {a ?? 'All'}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Status</span>
          {([undefined, 'success', 'denied'] as StatusFilter[]).map((s) => (
            <button
              key={s ?? 'all'}
              onClick={() => handleStatusFilter(s)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {s ?? 'All'}
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs text-muted-foreground">
          Total:{' '}
          <strong className="text-foreground">{totalCount.toLocaleString()}</strong> records
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">DataStoreBackend</code> —
        fake backend with 10,000 records (drop-in replaceable with IndexedDB, REST API, etc.).{' '}
        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">hydrate()</code> loads the
        initial page on mount;{' '}
        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">query()</code> is called on
        every page or filter change — only {PAGE_SIZE} rows are held in memory at a time.
      </p>

      <DataGrid
        key={gridKey}
        dataStore={store}
        columns={columns}
        isLoading={isLoading}
        enablePagination
        paginationConfig={{ pageSize: PAGE_SIZE }}
        totalCount={totalCount}
        onPageChange={(pageIndex, size) => {
          runQuery({ limit: size, offset: pageIndex * size, filter: filterRef.current })
        }}
        enableSorting={false}
        tableHeight={460}
        emptyMessage="No records found"
        tableKey="backend-demo"
      />
    </section>
  )
}

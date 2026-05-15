import { useMemo } from 'react'
import {
  DataGrid,
  DataGridPaginationBar,
  GlobalSearch,
  useDataStore,
  useDataStoreQueryState,
} from '@loykin/gridkit'
import type {
  DataGridColumnDef,
  DataStoreBackend,
  FilterExpr,
  QueryParams,
  SortExpr,
} from '@loykin/gridkit'

interface AuditEvent {
  id: string
  timestamp: string
  user: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'READ'
  resource: string
  namespace: string
  status: 'success' | 'denied'
}

const USERS = ['alice', 'bob', 'carol', 'dave', 'eve', 'frank']
const RESOURCES = ['Pod', 'Deployment', 'Service', 'ConfigMap', 'Secret', 'Ingress']
const NAMESPACES = ['default', 'kube-system', 'monitoring', 'prod', 'staging']
const PAGE_SIZE = 20

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

function readField(row: AuditEvent, field: string): unknown {
  return row[field as keyof AuditEvent]
}

function matchesFilter(row: AuditEvent, filter: FilterExpr): boolean {
  const raw = readField(row, filter.field)
  const text = String(raw ?? '').toLowerCase()
  const value = filter.value

  switch (filter.op) {
    case 'eq':
      return raw === value
    case 'neq':
      return raw !== value
    case 'in':
      return Array.isArray(value) && value.includes(raw)
    case 'notIn':
      return Array.isArray(value) && !value.includes(raw)
    case 'like':
      return text.includes(String(value ?? '').toLowerCase())
    case 'startsWith':
      return text.startsWith(String(value ?? '').toLowerCase())
    case 'endsWith':
      return text.endsWith(String(value ?? '').toLowerCase())
    case 'empty':
      return raw == null || raw === ''
    case 'notEmpty':
      return raw != null && raw !== ''
    case 'range': {
      if (!Array.isArray(value)) return true
      const [min, max] = value
      const comparable = typeof raw === 'number' ? raw : String(raw ?? '')
      return (min === '' || min == null || comparable >= min) && (max === '' || max == null || comparable <= max)
    }
    case 'gt':
      return raw != null && value != null && raw > value
    case 'gte':
      return raw != null && value != null && raw >= value
    case 'lt':
      return raw != null && value != null && raw < value
    case 'lte':
      return raw != null && value != null && raw <= value
    default:
      return true
  }
}

function applySort(rows: AuditEvent[], sort: SortExpr[]): AuditEvent[] {
  if (sort.length === 0) return rows
  return [...rows].sort((a, b) => {
    for (const item of sort) {
      const left = readField(a, item.field)
      const right = readField(b, item.field)
      if (left === right) continue
      const result = String(left ?? '').localeCompare(String(right ?? ''), undefined, {
        numeric: true,
        sensitivity: 'base',
      })
      return item.desc ? -result : result
    }
    return 0
  })
}

function applyQuery(data: AuditEvent[], params: QueryParams): { rows: AuditEvent[]; total: number } {
  let result = data

  if (params.globalFilter) {
    const needle = params.globalFilter.toLowerCase()
    result = result.filter((row) =>
      [row.id, row.timestamp, row.user, row.action, row.resource, row.namespace, row.status]
        .some((value) => value.toLowerCase().includes(needle)),
    )
  }

  if (params.filters && params.filters.length > 0) {
    result = result.filter((row) => params.filters!.every((filter) => matchesFilter(row, filter)))
  }

  result = applySort(result, params.sort ?? [])

  const total = result.length
  const limit = params.limit ?? PAGE_SIZE
  const offset = params.offset ?? 0
  return { rows: result.slice(offset, offset + limit), total }
}

function createFakeAuditBackend(data: AuditEvent[]): DataStoreBackend<AuditEvent> {
  const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

  return {
    capabilities: {
      filtering: true,
      sorting: true,
      pagination: true,
      globalSearch: true,
      multiSort: true,
    },
    query: async (params) => {
      await delay(180)
      return applyQuery(data, params)
    },
    getFacets: async ({ field, filters, globalFilter, limit = 50 }) => {
      await delay(80)
      const scoped = applyQuery(data, { filters, globalFilter, sort: [], limit: data.length, offset: 0 }).rows
      const values = Array.from(new Set(scoped.map((row) => String(readField(row, field) ?? ''))))
        .filter(Boolean)
        .sort()
      return {
        values: values.slice(0, limit),
        truncated: values.length > limit,
        hasEmpty: scoped.some((row) => readField(row, field) == null || readField(row, field) === ''),
      }
    },
  }
}

const ACTION_STYLE: Record<AuditEvent['action'], string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  READ: 'bg-muted text-muted-foreground',
}

const columns: DataGridColumnDef<AuditEvent>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Timestamp',
    meta: { width: 160, filterType: 'datetime-range', backendField: 'timestamp', backendType: 'date' },
  },
  {
    accessorKey: 'user',
    header: 'User',
    meta: { flex: 1, filterType: 'text', backendField: 'user', backendType: 'string' },
  },
  {
    accessorKey: 'action',
    header: 'Action',
    meta: { width: 100, filterType: 'multi-select', backendField: 'action', backendType: 'string' },
    cell: ({ row }) => (
      <span
        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${ACTION_STYLE[row.original.action]}`}
      >
        {row.original.action}
      </span>
    ),
  },
  {
    accessorKey: 'resource',
    header: 'Resource',
    meta: { flex: 1, filterType: 'select', backendField: 'resource', backendType: 'string' },
  },
  {
    accessorKey: 'namespace',
    header: 'Namespace',
    meta: { flex: 1, filterType: 'select', backendField: 'namespace', backendType: 'string' },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { width: 90, filterType: 'select', backendField: 'status', backendType: 'string' },
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

export function BackendTab() {
  const allData = useMemo(() => generateAuditEvents(10_000), [])
  const backend = useMemo(() => createFakeAuditBackend(allData), [allData])
  const store = useDataStore<AuditEvent>({ getRowId: (event) => event.id, backend })
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
        columns={columns}
        headerLeft={(table) => <GlobalSearch table={table} placeholder="Search audit events..." />}
        pagination={{ pageSize: PAGE_SIZE }}
        footer={(table) => <DataGridPaginationBar table={table} totalCount={queryState.total} />}
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

import type {
  DataGridColumnDef,
  DataStoreBackend,
  FilterExpr,
  QueryParams,
  SortExpr,
} from '@loykin/gridkit'

export interface AuditEvent {
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

export const BACKEND_PAGE_SIZE = 20

export function generateAuditEvents(count: number): AuditEvent[] {
  const base = new Date('2024-01-01').getTime()
  return Array.from({ length: count }, (_, i) => {
    const roll = Math.random()
    return {
      id: String(i + 1),
      timestamp: new Date(base + i * 30_000).toISOString().slice(0, 19).replace('T', ' '),
      user: USERS[Math.floor(Math.random() * USERS.length)]!,
      action: (roll < 0.5 ? 'READ' : roll < 0.7 ? 'UPDATE' : roll < 0.85 ? 'CREATE' : 'DELETE') as AuditEvent['action'],
      resource: RESOURCES[Math.floor(Math.random() * RESOURCES.length)]!,
      namespace: i % 37 === 0 ? '' : NAMESPACES[Math.floor(Math.random() * NAMESPACES.length)]!,
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
    case 'eq': return raw === value
    case 'neq': return raw !== value
    case 'in': return Array.isArray(value) && value.includes(raw)
    case 'notIn': return Array.isArray(value) && !value.includes(raw)
    case 'like': return text.includes(String(value ?? '').toLowerCase())
    case 'startsWith': return text.startsWith(String(value ?? '').toLowerCase())
    case 'endsWith': return text.endsWith(String(value ?? '').toLowerCase())
    case 'empty': return raw == null || raw === ''
    case 'notEmpty': return raw != null && raw !== ''
    case 'range': {
      if (!Array.isArray(value)) return true
      const [min, max] = value
      const comparable = typeof raw === 'number' ? raw : String(raw ?? '')
      return (min === '' || min == null || comparable >= min) && (max === '' || max == null || comparable <= max)
    }
    case 'gt': return raw != null && value != null && raw > value
    case 'gte': return raw != null && value != null && raw >= value
    case 'lt': return raw != null && value != null && raw < value
    case 'lte': return raw != null && value != null && raw <= value
    default: return true
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
  const limit = params.limit ?? BACKEND_PAGE_SIZE
  const offset = params.offset ?? 0
  return { rows: result.slice(offset, offset + limit), total }
}

export function createFakeAuditBackend(data: AuditEvent[]): DataStoreBackend<AuditEvent> {
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

export const auditColumns: DataGridColumnDef<AuditEvent>[] = [
  {
    accessorKey: 'timestamp',
    header: 'Timestamp',
    meta: { width: 160, filterType: 'datetime-range', backend: { field: 'timestamp', filterType: 'range' } },
  },
  {
    accessorKey: 'user',
    header: 'User',
    meta: { flex: 1, filterType: 'text', backend: { field: 'user', filterType: 'text', sortable: true } },
  },
  {
    accessorKey: 'action',
    header: 'Action',
    meta: { width: 100, filterType: 'multi-select', backend: { field: 'action', filterType: 'multi-select' } },
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
    meta: { flex: 1, filterType: 'select', backend: { field: 'resource' } },
  },
  {
    accessorKey: 'namespace',
    header: 'Namespace',
    meta: { flex: 1, filterType: 'multi-select', backend: { field: 'namespace', filterType: 'multi-select' } },
    cell: ({ row }) => row.original.namespace || <span className="text-muted-foreground">(empty)</span>,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { width: 90, filterType: 'select', backend: { field: 'status' } },
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

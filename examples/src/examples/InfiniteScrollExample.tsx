import { useState } from 'react'
import { DataGridInfinity } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'

// ── Types & Data ───────────────────────────────────────────────────────────────

interface LogEntry {
  id: number
  timestamp: string
  level: 'INFO' | 'WARN' | 'ERROR'
  service: string
  message: string
}

const SERVICES = ['api-gateway', 'auth-service', 'payment', 'notification', 'scheduler']
const MESSAGES: Record<LogEntry['level'], string[]> = {
  INFO:  ['Request processed', 'User authenticated', 'Cache hit', 'Job completed'],
  WARN:  ['High latency: 1.2s', 'Retry attempt 2/3', 'Memory at 80%'],
  ERROR: ['Connection refused', 'Timeout after 30s', 'Validation failed'],
}

function generatePage(offset: number, size: number): LogEntry[] {
  return Array.from({ length: size }, (_, i) => {
    const idx  = offset + i
    const level: LogEntry['level'] = idx % 10 === 0 ? 'ERROR' : idx % 4 === 0 ? 'WARN' : 'INFO'
    const msgs = MESSAGES[level]
    return {
      id:        idx + 1,
      timestamp: new Date(Date.now() - (1000 - idx) * 60_000).toLocaleTimeString(),
      level,
      service:   SERVICES[idx % SERVICES.length]!,
      message:   msgs[idx % msgs.length]!,
    }
  })
}

const PAGE_SIZE   = 30
const TOTAL_ITEMS = 300

// ── Columns ────────────────────────────────────────────────────────────────────

const columns: DataGridColumnDef<LogEntry>[] = [
  { accessorKey: 'id',        header: 'ID',        meta: { flex: 0.4 } },
  { accessorKey: 'timestamp', header: 'Time',      meta: { flex: 1 } },
  {
    accessorKey: 'level',
    header: 'Level',
    meta: { flex: 0.6 },
    cell: ({ row }) => {
      const l = row.original.level
      const color = l === 'ERROR' ? '#dc2626' : l === 'WARN' ? '#d97706' : '#2563eb'
      return <span style={{ fontWeight: 600, fontSize: 11, color }}>{l}</span>
    },
  },
  { accessorKey: 'service', header: 'Service', meta: { flex: 1.2 } },
  { accessorKey: 'message', header: 'Message', meta: { flex: 3 } },
]

// ── Example ────────────────────────────────────────────────────────────────────

export function InfiniteScrollExample() {
  const [data, setData]               = useState<LogEntry[]>(() => generatePage(0, PAGE_SIZE))
  const [isFetching, setFetching]     = useState(false)

  const hasNextPage = data.length < TOTAL_ITEMS

  async function fetchNextPage() {
    if (isFetching || !hasNextPage) return
    setFetching(true)
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 400))
    setData((prev) => [...prev, ...generatePage(prev.length, PAGE_SIZE)])
    setFetching(false)
  }

  return (
    <DataGridInfinity
      data={data}
      columns={columns}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetching}
      fetchNextPage={fetchNextPage}
      tableHeight={520}
      emptyMessage="No logs"
    />
  )
}

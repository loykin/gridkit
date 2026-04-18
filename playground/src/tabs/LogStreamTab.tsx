import { useEffect, useState } from 'react'
import { DataGrid, useDataStore } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'

// ── Types ─────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string
  timestamp: string
  level: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR'
  pod: string
  message: string
}

// ── Data generation ───────────────────────────────────────────────────────────

const PODS = ['api-7f9d4', 'worker-3a1bc', 'scheduler-9e2f1', 'gateway-5c8d2', 'inference-2b4e7']
const MESSAGES: Record<LogEntry['level'], string[]> = {
  DEBUG: ['Fetching resource config', 'Cache hit for key', 'Connection pool size: 12', 'Reconcile loop tick'],
  INFO: ['Request processed in 42ms', 'Pod status updated to Running', 'Lease acquired', 'Sync complete'],
  WARN: ['High memory usage: 87%', 'Retry attempt 2/3', 'Slow query detected: 1.2s', 'Certificate expiring in 7 days'],
  ERROR: ['Failed to connect to etcd', 'CrashLoopBackOff detected', 'OOMKilled: container evicted', 'Readiness probe failed'],
}

let seq = 0

function generateLog(): LogEntry {
  const roll = Math.random()
  const level: LogEntry['level'] =
    roll < 0.5 ? 'INFO' : roll < 0.75 ? 'DEBUG' : roll < 0.9 ? 'WARN' : 'ERROR'
  const msgs = MESSAGES[level]
  return {
    id: String(++seq),
    timestamp: new Date().toISOString().slice(11, 23),
    level,
    pod: PODS[Math.floor(Math.random() * PODS.length)]!,
    message: msgs[Math.floor(Math.random() * msgs.length)]!,
  }
}

// ── Columns ───────────────────────────────────────────────────────────────────

const LEVEL_STYLE: Record<LogEntry['level'], string> = {
  DEBUG: 'text-muted-foreground',
  INFO: 'text-blue-600 dark:text-blue-400',
  WARN: 'text-yellow-600 dark:text-yellow-500',
  ERROR: 'text-red-600 dark:text-red-400',
}

const columns: DataGridColumnDef<LogEntry>[] = [
  { accessorKey: 'timestamp', header: 'Time', meta: { width: 110 } },
  {
    accessorKey: 'level',
    header: 'Level',
    meta: { width: 68 },
    cell: ({ row }) => (
      <span className={`font-mono text-xs font-semibold ${LEVEL_STYLE[row.original.level]}`}>
        {row.original.level}
      </span>
    ),
  },
  { accessorKey: 'pod', header: 'Pod', meta: { flex: 1.5 } },
  { accessorKey: 'message', header: 'Message', meta: { flex: 4 } },
]

// ── Component ─────────────────────────────────────────────────────────────────

const MAX_SIZE = 500
const SPEEDS = [50, 200, 500] as const
type Speed = (typeof SPEEDS)[number]

export function LogStreamTab() {
  const store = useDataStore<LogEntry>({ getRowId: (l) => l.id, maxSize: MAX_SIZE })
  const [running, setRunning] = useState(true)
  const [speed, setSpeed] = useState<Speed>(200)
  const [received, setReceived] = useState(0)

  useEffect(() => {
    if (!running) return
    const timer = globalThis.setInterval(() => {
      store.applyTransaction({ add: [generateLog()] })
      setReceived((n) => n + 1)
    }, speed)
    return () => clearInterval(timer)
  }, [running, speed]) // eslint-disable-line react-hooks/exhaustive-deps

  const inMemory = Math.min(received, MAX_SIZE)
  const evicting = received > MAX_SIZE

  return (
    <section className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Speed</span>
          {SPEEDS.map((ms) => (
            <button
              key={ms}
              onClick={() => setSpeed(ms)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                speed === ms
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {ms}ms
            </button>
          ))}
        </div>

        <button
          onClick={() => setRunning((r) => !r)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            running
              ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
              : 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300 hover:opacity-80'
          }`}
        >
          {running ? 'Pause' : 'Resume'}
        </button>

        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">
            Received: <strong className="text-foreground">{received.toLocaleString()}</strong>
          </span>
          <span className={evicting ? 'text-amber-600 dark:text-amber-400 font-medium' : 'text-muted-foreground'}>
            In memory:{' '}
            <strong>
              {inMemory} / {MAX_SIZE}
            </strong>
            {evicting && ' — evicting oldest rows'}
          </span>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">maxSize: {MAX_SIZE}</code> —
        only the latest {MAX_SIZE} rows are kept in memory regardless of how many entries have
        been received. Oldest rows are evicted automatically once the limit is reached.
      </p>

      <DataGrid
        dataStore={store}
        columns={columns}
        enableSorting={false}
        tableHeight={500}
        emptyMessage="Waiting for logs..."
        tableKey="log-stream"
      />
    </section>
  )
}

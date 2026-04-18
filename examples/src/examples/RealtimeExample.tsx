import { useEffect, useRef, useState } from 'react'
import { DataGrid, useDataStore } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'

// ── Types & Data ───────────────────────────────────────────────────────────────

interface Service {
  id: string
  name: string
  namespace: string
  status: 'Healthy' | 'Degraded' | 'Down' | 'Starting'
  cpu: number
  memory: number
  restarts: number
  node: string
}

const NAMESPACES = ['default', 'monitoring', 'data', 'auth', 'gateway']
const NODES      = ['node-01', 'node-02', 'node-03', 'node-04']
const WORKLOADS  = ['api', 'worker', 'scheduler', 'proxy', 'collector', 'syncer', 'inference']
const STATUSES: Service['status'][] = ['Healthy', 'Degraded', 'Down', 'Starting']

function rnd(n: number) { return Math.floor(Math.random() * n) }
function pick<T>(arr: T[]) { return arr[rnd(arr.length)]! }
function uid() { return Math.random().toString(36).slice(2, 7) }

function generateServices(count: number): Service[] {
  return Array.from({ length: count }, (_, i) => {
    const workload = WORKLOADS[i % WORKLOADS.length]!
    const idx = String(i + 1).padStart(3, '0')
    return {
      id:        `svc-${workload}-${idx}`,
      name:      `${workload}-${idx}`,
      namespace: NAMESPACES[i % NAMESPACES.length]!,
      status:    i % 10 === 0 ? 'Degraded' : i % 20 === 0 ? 'Down' : 'Healthy',
      cpu:       50 + rnd(400),
      memory:    128 + rnd(768),
      restarts:  rnd(8),
      node:      NODES[i % NODES.length]!,
    }
  })
}

// ── Columns ────────────────────────────────────────────────────────────────────

const STATUS_STYLE: Record<Service['status'], { bg: string; color: string }> = {
  Healthy:  { bg: '#dcfce7', color: '#166534' },
  Starting: { bg: '#fef9c3', color: '#854d0e' },
  Degraded: { bg: '#ffedd5', color: '#9a3412' },
  Down:     { bg: '#fee2e2', color: '#991b1b' },
}

const columns: DataGridColumnDef<Service>[] = [
  { accessorKey: 'name',      header: 'Service',   meta: { flex: 2.5, filterType: 'text' } },
  { accessorKey: 'namespace', header: 'Namespace', meta: { flex: 1.2, filterType: 'select' } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 1, filterType: 'select' },
    cell: ({ row }) => {
      const s = row.original.status
      const { bg, color } = STATUS_STYLE[s]
      return (
        <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: bg, color }}>
          {s}
        </span>
      )
    },
  },
  {
    accessorKey: 'cpu',
    header: 'CPU (m)',
    meta: { flex: 0.8, align: 'right', filterType: 'number' },
    cell: ({ row }) => `${row.original.cpu}m`,
  },
  {
    accessorKey: 'memory',
    header: 'Mem (Mi)',
    meta: { flex: 0.9, align: 'right', filterType: 'number' },
    cell: ({ row }) => `${row.original.memory}Mi`,
  },
  {
    accessorKey: 'restarts',
    header: 'Restarts',
    meta: { flex: 0.7, align: 'right' },
    cell: ({ row }) => {
      const n = row.original.restarts
      return <span style={n >= 5 ? { color: '#d97706', fontWeight: 600 } : undefined}>{n}</span>
    },
  },
  { accessorKey: 'node', header: 'Node', meta: { flex: 1, filterType: 'select' } },
]

// ── Transaction log types ──────────────────────────────────────────────────────

type TxKind = 'add' | 'update' | 'delete'

interface TxLogEntry {
  id: number
  kind: TxKind
  msg: string
}

const KIND_LABEL: Record<TxKind, string> = {
  add:    '+ add   ',
  update: '~ update',
  delete: '- delete',
}
const KIND_COLOR: Record<TxKind, string> = {
  add:    '#16a34a',
  update: '#2563eb',
  delete: '#dc2626',
}

// ── Example ────────────────────────────────────────────────────────────────────

const INTERVALS = [200, 500, 1000, 2000] as const
type Interval = (typeof INTERVALS)[number]

const INITIAL_COUNT = 80

export function RealtimeExample() {
  const store = useDataStore<Service>({ getRowId: (s) => s.id })

  const [running, setRunning]       = useState(true)
  const [intervalMs, setIntervalMs] = useState<Interval>(500)
  const [log, setLog]               = useState<TxLogEntry[]>([])
  const [counts, setCounts]         = useState({ add: 0, update: 0, delete: 0 })
  const [svcCount, setSvcCount]     = useState(INITIAL_COUNT)
  const logId = useRef(0)

  // Seed store on mount
  useEffect(() => {
    store.applyTransaction({ add: generateServices(INITIAL_COUNT) })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  function pushLog(kind: TxKind, msg: string) {
    setLog((prev) => [{ id: logId.current++, kind, msg }, ...prev].slice(0, 80))
    setCounts((c) => ({ ...c, [kind]: c[kind] + 1 }))
  }

  function tick(snapshot: Service[]) {
    if (snapshot.length === 0) return
    const roll = Math.random()

    if (roll < 0.2 && snapshot.length < 200) {
      // ADD
      const workload = pick(WORKLOADS)
      const newSvc: Service = {
        id:        `svc-${workload}-${uid()}`,
        name:      `${workload}-${uid()}`,
        namespace: pick(NAMESPACES),
        status:    'Starting',
        cpu:       50 + rnd(200),
        memory:    128 + rnd(512),
        restarts:  0,
        node:      pick(NODES),
      }
      store.applyTransaction({ add: [newSvc] })
      pushLog('add', newSvc.name)
      setSvcCount((n) => n + 1)
    } else if (roll < 0.3 && snapshot.length > 10) {
      // DELETE
      const target = snapshot[rnd(snapshot.length)]!
      store.applyTransaction({ remove: [target.id] })
      pushLog('delete', target.name)
      setSvcCount((n) => n - 1)
    } else {
      // UPDATE — 1–4 services
      const batch = Math.min(1 + rnd(3), snapshot.length)
      const updates: Array<{ id: string; data: Partial<Service> }> = []

      for (let i = 0; i < batch; i++) {
        const svc = snapshot[rnd(snapshot.length)]!
        const field = rnd(3)
        let data: Partial<Service>
        let detail: string

        if (field === 0) {
          const next = pick(STATUSES)
          data = { status: next }
          detail = `status→${next}`
        } else if (field === 1) {
          const next = Math.max(10, svc.cpu + Math.floor((Math.random() - 0.5) * 300))
          data = { cpu: next }
          detail = `cpu ${svc.cpu}→${next}`
        } else {
          const next = Math.max(32, svc.memory + Math.floor((Math.random() - 0.5) * 600))
          data = { memory: next }
          detail = `mem ${svc.memory}→${next}`
        }

        updates.push({ id: svc.id, data })
        pushLog('update', `${svc.name.slice(0, 20)} (${detail})`)
      }
      store.applyTransaction({ update: updates })
    }
  }

  // Interval runner
  useEffect(() => {
    if (!running) return
    const timer = globalThis.setInterval(() => { tick(store.getSnapshot()) }, intervalMs)
    return () => clearInterval(timer)
  }, [running, intervalMs]) // eslint-disable-line react-hooks/exhaustive-deps

  function reset() {
    store.applyTransaction({ remove: store.getSnapshot().map((s) => s.id) })
    store.applyTransaction({ add: generateServices(INITIAL_COUNT) })
    setLog([])
    setCounts({ add: 0, update: 0, delete: 0 })
    setSvcCount(INITIAL_COUNT)
  }

  const totalTx = counts.add + counts.update + counts.delete

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>

        {/* Interval buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, color: '#6b7280' }}>Interval</span>
          {INTERVALS.map((ms) => (
            <button
              key={ms}
              onClick={() => setIntervalMs(ms)}
              style={{
                padding: '3px 10px',
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                background: intervalMs === ms ? '#1e40af' : '#f1f5f9',
                color:      intervalMs === ms ? '#fff'    : '#475569',
              }}
            >
              {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
            </button>
          ))}
        </div>

        {/* Pause / Resume */}
        <button
          onClick={() => setRunning((r) => !r)}
          style={{
            padding: '3px 12px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            background: running ? '#fee2e2' : '#dcfce7',
            color:      running ? '#991b1b' : '#166534',
          }}
        >
          {running ? 'Pause' : 'Resume'}
        </button>

        {/* Reset */}
        <button
          onClick={reset}
          style={{
            padding: '3px 12px',
            borderRadius: 6,
            border: 'none',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 500,
            background: '#f1f5f9',
            color: '#475569',
          }}
        >
          Reset
        </button>

        {/* Stats */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontSize: 12 }}>
          <span style={{ color: '#6b7280' }}>Services: <strong style={{ color: '#111827' }}>{svcCount}</strong></span>
          <span style={{ color: '#16a34a' }}>+add: <strong>{counts.add}</strong></span>
          <span style={{ color: '#2563eb' }}>~update: <strong>{counts.update}</strong></span>
          <span style={{ color: '#dc2626' }}>-delete: <strong>{counts.delete}</strong></span>
          <span style={{ color: '#6b7280' }}>Total tx: <strong style={{ color: '#111827' }}>{totalTx}</strong></span>
        </div>
      </div>

      {/* Grid + Log */}
      <div style={{ display: 'flex', gap: 16, height: 500 }}>

        {/* DataGrid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <DataGrid
            dataStore={store}
            columns={columns}
            enableSorting
            enableColumnFilters
            bordered
            tableHeight="100%"
            emptyMessage="No services"
            tableKey="realtime-demo"
          />
        </div>

        {/* Transaction log */}
        <div style={{
          width: 260,
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #e5e7eb',
          borderRadius: 6,
          overflow: 'hidden',
          fontSize: 11,
          fontFamily: 'monospace',
        }}>
          <div style={{
            padding: '6px 12px',
            borderBottom: '1px solid #e5e7eb',
            background: '#f9fafb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <span style={{ fontSize: 12, fontWeight: 600 }}>Transaction Log</span>
            <button
              onClick={() => setLog([])}
              style={{ fontSize: 11, color: '#9ca3af', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              Clear
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {log.length === 0 ? (
              <p style={{ padding: '16px 12px', textAlign: 'center', color: '#9ca3af', fontSize: 12 }}>
                Waiting for events…
              </p>
            ) : (
              log.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '2px 12px',
                    borderBottom: '1px solid #f3f4f6',
                    display: 'flex',
                    gap: 8,
                    lineHeight: '1.6',
                  }}
                >
                  <span style={{ flexShrink: 0, color: KIND_COLOR[entry.kind] }}>
                    {KIND_LABEL[entry.kind]}
                  </span>
                  <span style={{ color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {entry.msg}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

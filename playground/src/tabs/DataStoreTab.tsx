import { useEffect, useRef, useState } from 'react'
import { DataGrid, useDataStore } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { generatePods, type Pod } from '../data/pods'

// ── Column definitions ────────────────────────────────────────────────────────

const STATUS_STYLE: Record<Pod['status'], string> = {
  Running: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300',
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-300',
  Failed: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  CrashLoopBackOff: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
  Terminating: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
}

const columns: DataGridColumnDef<Pod>[] = [
  { accessorKey: 'name', header: 'Pod Name', meta: { flex: 3, filterType: 'text' } },
  { accessorKey: 'namespace', header: 'Namespace', meta: { flex: 1.2, filterType: 'select' } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 1.2, filterType: 'select' },
    cell: ({ row }) => {
      const s = row.original.status
      return (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s]}`}
        >
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
      return <span className={n >= 5 ? 'text-orange-600 font-medium' : undefined}>{n}</span>
    },
  },
  { accessorKey: 'node', header: 'Node', meta: { flex: 1, filterType: 'select' } },
  { accessorKey: 'age', header: 'Age', meta: { flex: 0.6, align: 'right' } },
  {
    id: '__actions__',
    header: '',
    size: 48,
    enableSorting: false,
    enableResizing: false,
    meta: {
      filterType: false,
      actions: (p: Pod) => [
        { label: 'Logs', onClick: () => alert(`logs ${p.name}`) },
        {
          label: 'Delete',
          variant: 'destructive' as const,
          onClick: (pod) => {
            // Will be wired to store in the component via onTableReady / tableRef
            // For demo we alert — real delete handled by the store watcher
            alert(`delete ${pod.name}`)
          },
        },
      ],
    },
  },
]

// ── Transaction simulator ─────────────────────────────────────────────────────

type TxKind = 'add' | 'update' | 'delete'
interface LogEntry {
  id: number
  kind: TxKind
  msg: string
}

const NAMESPACES = ['default', 'kube-system', 'monitoring', 'data-platform', 'ml-serving']
const NODES = ['node-01', 'node-02', 'node-03', 'node-04', 'node-05']
const WORKLOADS = [
  'api',
  'worker',
  'scheduler',
  'gateway',
  'inference',
  'collector',
  'syncer',
  'proxy',
]
const STATUSES: Pod['status'][] = ['Running', 'Pending', 'Failed', 'CrashLoopBackOff']

function rnd(n: number) {
  return Math.floor(Math.random() * n)
}
function pick<T>(arr: T[]) {
  return arr[rnd(arr.length)]!
}
function uid() {
  return Math.random().toString(36).slice(2, 7)
}

const INTERVALS = [200, 500, 1000, 2000] as const
type Interval = (typeof INTERVALS)[number]

const KIND_LABEL: Record<TxKind, string> = {
  add: '+ add   ',
  update: '~ update',
  delete: '- delete',
}
const KIND_COLOR: Record<TxKind, string> = {
  add: 'text-green-600 dark:text-green-400',
  update: 'text-blue-600 dark:text-blue-400',
  delete: 'text-red-500 dark:text-red-400',
}

// ── Component ─────────────────────────────────────────────────────────────────

const INITIAL_COUNT = 120

export function DataStoreTab() {
  const store = useDataStore<Pod>({ getRowId: (p) => p.id })

  const [running, setRunning] = useState(true)
  const [interval, setInterval_] = useState<Interval>(500)
  const [log, setLog] = useState<LogEntry[]>([])
  const [counts, setCounts] = useState({ add: 0, update: 0, delete: 0 })
  const [podCount, setPodCount] = useState(INITIAL_COUNT)
  const logId = useRef(0)

  // Seed the store once on mount
  useEffect(() => {
    const initial = generatePods(INITIAL_COUNT)
    store.applyTransaction({ add: initial })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Push a log entry and update counts
  function pushLog(kind: TxKind, msg: string) {
    const entry: LogEntry = { id: logId.current++, kind, msg }
    setLog((prev) => [entry, ...prev].slice(0, 80))
    setCounts((c) => ({ ...c, [kind]: c[kind] + 1 }))
  }

  // Simulated K8s watch event
  function tick(snapshot: Pod[]) {
    if (snapshot.length === 0) return

    const roll = Math.random()

    if (roll < 0.25 && snapshot.length < 300) {
      // ADD
      const workload = pick(WORKLOADS)
      const idx = rnd(9999)
      const newPod: Pod = {
        id: `pod-${workload}-${String(idx).padStart(4, '0')}-${uid()}`,
        name: `${workload}-${String(idx).padStart(4, '0')}-${uid()}`,
        namespace: pick(NAMESPACES),
        status: 'Pending',
        cpu: 50 + rnd(200),
        memory: 128 + rnd(512),
        restarts: 0,
        node: pick(NODES),
        age: '0d',
      }
      store.applyTransaction({ add: [newPod] })
      pushLog('add', newPod.name)
      setPodCount((n) => n + 1)
    } else if (roll < 0.35 && snapshot.length > 10) {
      // DELETE
      const target = snapshot[rnd(snapshot.length)]!
      store.applyTransaction({ remove: [target.id] })
      pushLog('delete', target.name)
      setPodCount((n) => n - 1)
    } else {
      // UPDATE — 1–5 pods at once
      const batch = Math.min(1 + rnd(4), snapshot.length)
      const updates: Array<{ id: string; data: Partial<Pod> }> = []
      const msgs: string[] = []

      for (let i = 0; i < batch; i++) {
        const pod = snapshot[rnd(snapshot.length)]!
        const field = rnd(3)
        let data: Partial<Pod>
        let detail: string

        if (field === 0) {
          const next = pick(STATUSES)
          data = { status: next }
          detail = `status→${next}`
        } else if (field === 1) {
          const next = Math.max(10, pod.cpu + Math.floor((Math.random() - 0.5) * 300))
          data = { cpu: next }
          detail = `cpu ${pod.cpu}→${next}`
        } else {
          const next = Math.max(32, pod.memory + Math.floor((Math.random() - 0.5) * 800))
          data = { memory: next }
          detail = `mem ${pod.memory}→${next}`
        }

        updates.push({ id: pod.id, data })
        msgs.push(`${pod.name.slice(0, 22)} (${detail})`)
      }

      store.applyTransaction({ update: updates })
      msgs.forEach((m) => pushLog('update', m))
    }
  }

  // Interval runner
  useEffect(() => {
    if (!running) return
    const timer = globalThis.setInterval(() => {
      tick(store.getSnapshot())
    }, interval)
    return () => clearInterval(timer)
  }, [running, interval]) // eslint-disable-line react-hooks/exhaustive-deps

  const totalTx = counts.add + counts.update + counts.delete

  return (
    <section className="flex flex-col gap-4">
      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">Interval</span>
          {INTERVALS.map((ms) => (
            <button
              key={ms}
              onClick={() => setInterval_(ms)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                interval === ms
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
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

        <button
          onClick={() => {
            store.applyTransaction({ remove: store.getSnapshot().map((p) => p.id) })
            const fresh = generatePods(INITIAL_COUNT)
            store.applyTransaction({ add: fresh })
            setLog([])
            setCounts({ add: 0, update: 0, delete: 0 })
            setPodCount(INITIAL_COUNT)
          }}
          className="px-3 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
        >
          Reset
        </button>

        <div className="ml-auto flex items-center gap-4 text-xs">
          <span className="text-muted-foreground">
            Pods: <strong className="text-foreground">{podCount}</strong>
          </span>
          <span className="text-green-600 dark:text-green-400">
            +add: <strong>{counts.add}</strong>
          </span>
          <span className="text-blue-600 dark:text-blue-400">
            ~update: <strong>{counts.update}</strong>
          </span>
          <span className="text-red-500 dark:text-red-400">
            -delete: <strong>{counts.delete}</strong>
          </span>
          <span className="text-muted-foreground">
            Total tx: <strong className="text-foreground">{totalTx}</strong>
          </span>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground">
        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">useDataStore</code> +{' '}
        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">applyTransaction</code> pattern.{' '}
        Only changed rows are re-evaluated by{' '}
        <code className="bg-muted px-1 py-0.5 rounded text-[11px]">getDataStoreCoreRowModel</code> —
        Map-based O(1) add/update/delete without full array reconstruction.
      </p>

      {/* Grid + Log side by side */}
      <div className="flex gap-4" style={{ height: 520 }}>
        {/* DataGrid */}
        <div className="flex-1 min-w-0">
          <DataGrid
            dataStore={store}
            columns={columns}
            enableSorting
            enableColumnFilters
            bordered
            tableHeight="100%"
            emptyMessage="No pods"
            tableKey="datastore-demo"
          />
        </div>

        {/* Transaction log */}
        <div className="w-72 shrink-0 flex flex-col border border-border rounded-[--dg-radius] overflow-hidden">
          <div className="px-3 py-2 border-b border-border bg-muted/40 flex items-center justify-between">
            <span className="text-xs font-medium">Transaction Log</span>
            <button
              onClick={() => setLog([])}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed">
            {log.length === 0 ? (
              <p className="px-3 py-4 text-muted-foreground text-center text-xs">
                Waiting for events…
              </p>
            ) : (
              log.map((entry) => (
                <div
                  key={entry.id}
                  className="px-3 py-0.5 border-b border-border/40 hover:bg-muted/30 flex gap-2"
                >
                  <span className={`shrink-0 ${KIND_COLOR[entry.kind]}`}>
                    {KIND_LABEL[entry.kind]}
                  </span>
                  <span className="text-foreground/70 truncate">{entry.msg}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

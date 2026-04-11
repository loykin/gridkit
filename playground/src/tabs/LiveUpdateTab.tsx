import { useEffect, useRef, useState } from 'react'
import { DataGrid } from '@loykin/data-grid'
import type { DataGridColumnDef } from '@loykin/data-grid'
import { generatePods, tickPods, type Pod } from '../data/pods'

const STATUS_STYLE: Record<Pod['status'], string> = {
  Running:          'bg-green-100 text-green-800',
  Pending:          'bg-yellow-100 text-yellow-800',
  Failed:           'bg-red-100 text-red-800',
  CrashLoopBackOff: 'bg-orange-100 text-orange-800',
  Terminating:      'bg-gray-100 text-gray-600',
}

const columns: DataGridColumnDef<Pod>[] = [
  { accessorKey: 'name',      header: 'Pod Name',     meta: { flex: 3,   filterType: 'text' } },
  { accessorKey: 'namespace', header: 'Namespace',    meta: { flex: 1.2, filterType: 'select' } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 1.2, filterType: 'select' },
    cell: ({ row }) => {
      const s = row.original.status
      return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s]}`}>{s}</span>
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
    header: 'Memory (Mi)',
    meta: { flex: 1, align: 'right', filterType: 'number' },
    cell: ({ row }) => `${row.original.memory}Mi`,
  },
  {
    accessorKey: 'restarts',
    header: 'Restarts',
    meta: { flex: 0.7, align: 'right', filterType: 'number' },
    cell: ({ row }) => {
      const n = row.original.restarts
      return <span className={n >= 5 ? 'text-orange-600 font-medium' : undefined}>{n}</span>
    },
  },
  { accessorKey: 'node', header: 'Node', meta: { flex: 1, filterType: 'select' } },
  { accessorKey: 'age',  header: 'Age',  meta: { flex: 0.6, align: 'right' } },
  {
    id: '__actions__',
    header: '',
    size: 48,
    enableSorting: false,
    enableResizing: false,
    meta: {
      filterType: false,
      actions: (p: Pod) => [
        { label: 'Describe', onClick: () => alert(`describe ${p.name}`) },
        { label: 'Logs',     onClick: () => alert(`logs ${p.name}`) },
        { label: 'Delete',   onClick: () => alert(`delete ${p.name}`), variant: 'destructive' as const },
      ],
    },
  },
]

const INTERVALS = [500, 1000, 2000, 5000] as const
type Interval = typeof INTERVALS[number]

export function LiveUpdateTab() {
  const [pods, setPods] = useState<Pod[]>(() => generatePods(120))
  const [interval, setInterval_] = useState<Interval>(2000)
  const [running, setRunning] = useState(true)
  const [tickCount, setTickCount] = useState(0)
  const intervalRef = useRef<ReturnType<typeof globalThis.setInterval> | null>(null)

  useEffect(() => {
    if (!running) {
      if (intervalRef.current) clearInterval(intervalRef.current)
      return
    }
    intervalRef.current = globalThis.setInterval(() => {
      setPods((prev) => tickPods(prev))
      setTickCount((n) => n + 1)
    }, interval)
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [running, interval])

  const runningCount = pods.filter((p) => p.status === 'Running').length
  const crashCount   = pods.filter((p) => p.status === 'CrashLoopBackOff').length

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Interval:</span>
          {INTERVALS.map((ms) => (
            <button
              key={ms}
              onClick={() => setInterval_(ms)}
              className={`px-2 py-1 rounded text-xs font-medium transition-colors ${interval === ms ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}
            >
              {ms >= 1000 ? `${ms / 1000}s` : `${ms}ms`}
            </button>
          ))}
        </div>
        <button
          onClick={() => setRunning((r) => !r)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${running ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' : 'bg-green-100 text-green-800 hover:bg-green-200'}`}
        >
          {running ? 'Pause' : 'Resume'}
        </button>
        <button
          onClick={() => { setPods(generatePods(120)); setTickCount(0) }}
          className="px-3 py-1 rounded text-xs font-medium bg-muted text-muted-foreground hover:bg-muted/80"
        >
          Reset
        </button>
        <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
          <span>Ticks: <strong className="text-foreground">{tickCount}</strong></span>
          <span className="text-green-700">Running: <strong>{runningCount}</strong></span>
          {crashCount > 0 && <span className="text-orange-600">CrashLoop: <strong>{crashCount}</strong></span>}
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        120 pods · virtualizer auto-enabled · resize columns while updates run · sort/filter state preserved
      </p>
      <DataGrid
        data={pods}
        columns={columns}
        enablePagination={false}
        enableSorting
        enableColumnFilters
        bordered
        tableHeight={520}
        emptyMessage="No pods"
        tableKey="live-update"
      />
    </section>
  )
}

import { useState } from 'react'
import { GridKitTable, GridKitAutoTable, inferTablePayload } from '@loykin/gridkit'
import type { GridKitTableDef, GridKitQueryExecutor, GridKitTablePayload } from '@loykin/gridkit'
import { JsonEditor } from '../components/JsonEditor'
import { CodeBlock } from '../components/CodeBlock'

// ── Mock DB ───────────────────────────────────────────────────────────────────

const MOCK_DB: Record<string, Record<string, unknown>[]> = {
  users: [
    { id: 1, name: 'Alice Kim',   email: 'alice@example.com', role: 'Admin',  salary: 92000, joined_at: '2022-03-15', active: true },
    { id: 2, name: 'Bob Choi',    email: 'bob@example.com',   role: 'Dev',    salary: 85000, joined_at: '2022-07-01', active: true },
    { id: 3, name: 'Carol Park',  email: 'carol@example.com', role: 'Design', salary: 78000, joined_at: '2023-01-10', active: false },
    { id: 4, name: 'David Lee',   email: 'david@example.com', role: 'Dev',    salary: 88000, joined_at: '2021-11-20', active: true },
    { id: 5, name: 'Eva Müller',  email: 'eva@example.com',   role: 'PM',     salary: 94000, joined_at: '2020-06-05', active: true },
  ],
  orders: [
    { order_id: 'ORD-001', customer: 'Alice Kim',  product: 'Road Bike',    qty: 1, total: 1200000, ordered_at: '2024-03-10', shipped: true },
    { order_id: 'ORD-002', customer: 'Bob Choi',   product: 'Helmet',       qty: 2, total: 240000,  ordered_at: '2024-03-12', shipped: true },
    { order_id: 'ORD-003', customer: 'Carol Park', product: 'Saddle',       qty: 1, total: 95000,   ordered_at: '2024-03-18', shipped: false },
    { order_id: 'ORD-004', customer: 'David Lee',  product: 'Pedals',       qty: 2, total: 76000,   ordered_at: '2024-03-20', shipped: false },
    { order_id: 'ORD-005', customer: 'Eva Müller', product: 'Carbon Frame', qty: 1, total: 450000,  ordered_at: '2024-03-25', shipped: true },
  ],
  metrics: [
    { host: 'api-prod-01', region: 'us-east-1', cpu_pct: 72, mem_pct: 61, req_per_sec: 1840, healthy: true,  checked_at: '2024-03-31T10:00:00Z' },
    { host: 'api-prod-02', region: 'us-east-1', cpu_pct: 45, mem_pct: 58, req_per_sec: 1620, healthy: true,  checked_at: '2024-03-31T10:00:00Z' },
    { host: 'api-prod-03', region: 'eu-west-1', cpu_pct: 91, mem_pct: 88, req_per_sec: 520,  healthy: false, checked_at: '2024-03-31T09:58:00Z' },
    { host: 'api-prod-04', region: 'ap-east-1', cpu_pct: 33, mem_pct: 40, req_per_sec: 980,  healthy: true,  checked_at: '2024-03-31T10:00:00Z' },
  ],
}

// ── Section 1: GridKitTable ───────────────────────────────────────────────────

type MockQuery = { table: string }

const mockExecutor: GridKitQueryExecutor<MockQuery> = async (query) => {
  await new Promise((r) => setTimeout(r, 600))
  return MOCK_DB[query.table] ?? []
}

const SCENARIOS: { label: string; def: GridKitTableDef<MockQuery> }[] = [
  { label: 'Users',   def: { type: 'gridkit-table', title: 'User List',      query: { table: 'users'   } } },
  { label: 'Orders',  def: { type: 'gridkit-table', title: 'Order History',  query: { table: 'orders'  } } },
  { label: 'Metrics', def: { type: 'gridkit-table', title: 'Server Metrics', query: { table: 'metrics' } } },
]

const GRIDKIT_TABLE_CODE = `// 1. executor — your backend / MCP connector (define once per app)
const executor: GridKitQueryExecutor<MyQuery> = async (query) => {
  const res = await fetch('/api/query', {
    method: 'POST',
    body: JSON.stringify(query),
  })
  return res.json()  // raw rows[]
}

// 2. def — comes from page template JSON or AI-generated output
const def: GridKitTableDef<MyQuery> = {
  type: 'gridkit-table',
  title: 'User List',
  query: { table: 'users', filter: { active: true } },
}

// 3. GridKitTable handles fetch → inferTablePayload → render
<GridKitTable def={def} executor={executor} enableSorting />`

// ── Section 2: inferTablePayload ─────────────────────────────────────────────

const INFER_CODE = `// You already fetched rows yourself (React Query, SWR, useEffect, ...)
// inferTablePayload skips manual column definition

const { data: rows } = useQuery(['users'], fetchUsers)

const tableData = inferTablePayload(rows ?? [], { title: 'Users' })
// → { type: 'gridkit-table', columns: [...auto-inferred], rows }

<GridKitAutoTable payload={tableData} enableSorting />`

const INFER_DEFAULT = JSON.stringify([
  { user_id: 1, full_name: 'Alice Kim',  monthly_salary: 92000, hire_date: '2022-03-15T00:00:00Z', is_active: true  },
  { user_id: 2, full_name: 'Bob Choi',   monthly_salary: 85000, hire_date: '2022-07-01T00:00:00Z', is_active: false },
  { user_id: 3, full_name: 'Carol Park', monthly_salary: 78000, hire_date: '2023-01-10T00:00:00Z', is_active: true  },
], null, 2)

// ── Component ─────────────────────────────────────────────────────────────────

export function QueryTableTab() {
  const [scenarioIdx, setScenarioIdx] = useState(0)
  const [inferJson, setInferJson] = useState(INFER_DEFAULT)

  const scenario = SCENARIOS[scenarioIdx]!

  // inferTablePayload live preview
  let inferPayload: GridKitTablePayload | null = null
  let inferError = ''
  try {
    const parsed: unknown = JSON.parse(inferJson)
    if (!Array.isArray(parsed)) {
      inferError = 'Must be a JSON array of objects'
    } else {
      inferPayload = inferTablePayload(parsed as Record<string, unknown>[], { title: 'Result' })
    }
  } catch (e) {
    inferError = (e as Error).message
  }

  return (
    <div className="flex flex-col gap-8">

      {/* ── Section 1: GridKitTable ── */}
      <section className="flex flex-col gap-4">
        <div className="border-b border-border pb-3">
          <p className="text-sm font-semibold">GridKitTable</p>
          <p className="text-xs text-muted-foreground mt-1">
            Pass a <code className="rounded bg-muted px-1">def</code> (from a page template or AI output) and an{' '}
            <code className="rounded bg-muted px-1">executor</code> (your backend / MCP connector).
            The component owns the full lifecycle: <strong>fetch → infer columns → render</strong>.
            Define <code className="rounded bg-muted px-1">executor</code> once at the app level — like a Grafana data source.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Left: code + def */}
          <div className="flex flex-col gap-3">
            <CodeBlock code={GRIDKIT_TABLE_CODE} />

            <div>
              <p className="text-xs text-muted-foreground mb-1">def — page template block</p>
              <div className="flex gap-1.5 mb-2">
                {SCENARIOS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setScenarioIdx(i)}
                    className={`rounded border px-3 py-1 text-xs transition-colors ${
                      i === scenarioIdx
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
              <JsonEditor
                value={JSON.stringify(scenario.def, null, 2)}
                height={120}
                readOnly
              />
            </div>
          </div>

          {/* Right: rendered */}
          <div className="flex flex-col gap-1">
            <p className="text-xs text-muted-foreground">Rendered — columns auto-inferred from rows</p>
            <GridKitTable
              key={scenarioIdx}
              def={scenario.def}
              executor={mockExecutor}
              enableSorting
              tableHeight={360}
              tableKey={`query-table-${scenarioIdx}`}
              renderLoading={() => (
                <div className="flex h-90 items-center justify-center rounded border border-border text-xs text-muted-foreground">
                  Fetching from mock backend… (600ms delay)
                </div>
              )}
              renderError={(err) => (
                <div className="flex h-90 items-center justify-center rounded border border-destructive/40 bg-destructive/5 text-xs text-destructive">
                  {String(err)}
                </div>
              )}
            />
          </div>
        </div>
      </section>

      {/* ── Section 2: inferTablePayload ── */}
      <section className="flex flex-col gap-4">
        <div className="border-b border-border pb-3">
          <p className="text-sm font-semibold">inferTablePayload</p>
          <p className="text-xs text-muted-foreground mt-1">
            When you already fetch rows yourself (React Query, SWR, useEffect…) and just want to skip writing column definitions.
            Infers column type, label, and alignment from the values. Also used internally by <code className="rounded bg-muted px-1">GridKitTable</code>.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Left: code + editable rows */}
          <div className="flex flex-col gap-3">
            <CodeBlock code={INFER_CODE} />
            <div>
              <p className="text-xs text-muted-foreground mb-1">Raw rows — editable</p>
              <JsonEditor value={inferJson} height={200} onChange={setInferJson} />
            </div>
          </div>

          {/* Right: inferred columns + rendered */}
          <div className="flex flex-col gap-3">
            {inferError ? (
              <div className="rounded border border-destructive/40 bg-destructive/5 p-3">
                <p className="text-xs text-destructive">{inferError}</p>
              </div>
            ) : inferPayload ? (
              <>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Inferred columns</p>
                  <div className="rounded border border-border bg-muted/30 p-2 flex flex-wrap gap-1.5">
                    {inferPayload.columns.map((col) => (
                      <span key={col.key} className="rounded bg-background border border-border px-2 py-0.5 text-[11px] font-mono">
                        {col.key}
                        <span className="text-muted-foreground ml-1">
                          {col.type ?? 'text'}{col.align === 'right' ? ' · right' : ''}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
                <GridKitAutoTable
                  payload={inferPayload}
                  enableSorting
                  tableHeight={200}
                  tableKey="infer-preview"
                />
              </>
            ) : null}
          </div>
        </div>
      </section>

    </div>
  )
}

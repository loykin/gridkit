import { useState } from 'react'
import { GridKitAutoTable } from '@loykin/gridkit'
import type { GridKitTablePayload } from '@loykin/gridkit'
import { JsonEditor } from '../components/JsonEditor'

const SYSTEM_PROMPT = `When returning tabular data, always use this exact JSON format:

{
  "type": "gridkit-table",
  "title": "<optional table title>",
  "columns": [
    {
      "key": "<property name used in rows>",
      "label": "<display header>",
      "type": "<text | number | date | boolean>",
      "align": "<left | center | right>"
    }
  ],
  "rows": [
    { "<key>": <value>, ... }
  ]
}

Rules:
- "type" must always be "gridkit-table"
- "key" values in columns must match the property names in rows
- Column "type" and "align" are optional; omit if not applicable
- Do not wrap the JSON in markdown code fences`

const PAYLOADS: { label: string; payload: GridKitTablePayload }[] = [
  {
    label: 'Sales Report',
    payload: {
      type: 'gridkit-table',
      title: 'Q1 2024 Sales Report',
      columns: [
        { key: 'rep', label: 'Sales Rep' },
        { key: 'region', label: 'Region' },
        { key: 'deals', label: 'Deals', type: 'number', align: 'right' },
        { key: 'revenue', label: 'Revenue', type: 'number', align: 'right' },
        { key: 'closedAt', label: 'Last Close', type: 'date' },
        { key: 'active', label: 'Active', type: 'boolean', align: 'center' },
      ],
      rows: [
        { rep: 'Alice Kim',  region: 'APAC', deals: 24, revenue: 1820000, closedAt: '2024-03-28', active: true },
        { rep: 'Bob Choi',   region: 'NA',   deals: 31, revenue: 2540000, closedAt: '2024-03-30', active: true },
        { rep: 'Carol Park', region: 'EMEA', deals: 18, revenue: 1340000, closedAt: '2024-03-15', active: false },
        { rep: 'David Lee',  region: 'APAC', deals: 27, revenue: 2100000, closedAt: '2024-03-22', active: true },
        { rep: 'Eva Müller', region: 'EMEA', deals: 12, revenue: 980000,  closedAt: '2024-02-28', active: false },
        { rep: 'Frank Wang', region: 'NA',   deals: 42, revenue: 3710000, closedAt: '2024-03-31', active: true },
        { rep: 'Grace Yoon', region: 'APAC', deals: 19, revenue: 1450000, closedAt: '2024-03-18', active: true },
        { rep: 'Henry Sato', region: 'EMEA', deals: 9,  revenue: 720000,  closedAt: '2024-01-31', active: false },
      ],
    },
  },
  {
    label: 'Inventory',
    payload: {
      type: 'gridkit-table',
      title: 'Warehouse Inventory',
      columns: [
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Product' },
        { key: 'category', label: 'Category' },
        { key: 'stock', label: 'In Stock', type: 'number', align: 'right' },
        { key: 'price', label: 'Unit Price', type: 'number', align: 'right' },
        { key: 'available', label: 'Available', type: 'boolean', align: 'center' },
      ],
      rows: [
        { sku: 'WHL-001', name: 'Road Bike Wheel 700c', category: 'Wheels',      stock: 142, price: 89900,  available: true },
        { sku: 'FRM-004', name: 'Carbon Frame 56cm',    category: 'Frames',      stock: 0,   price: 450000, available: false },
        { sku: 'HLM-012', name: 'Aero Helmet M',        category: 'Helmets',     stock: 37,  price: 120000, available: true },
        { sku: 'PDL-007', name: 'SPD Clipless Pedal',   category: 'Pedals',      stock: 204, price: 38000,  available: true },
        { sku: 'GRP-003', name: 'Handlebar Grip Pair',  category: 'Accessories', stock: 88,  price: 12000,  available: true },
        { sku: 'SDD-009', name: 'Carbon Saddle',        category: 'Saddles',     stock: 5,   price: 95000,  available: true },
        { sku: 'CHN-002', name: '11-speed Chain',       category: 'Drivetrain',  stock: 0,   price: 22000,  available: false },
      ],
    },
  },
  {
    label: 'Server Metrics',
    payload: {
      type: 'gridkit-table',
      title: 'Production Server Metrics',
      columns: [
        { key: 'host', label: 'Host' },
        { key: 'region', label: 'Region' },
        { key: 'cpu', label: 'CPU %', type: 'number', align: 'right' },
        { key: 'mem', label: 'Mem %', type: 'number', align: 'right' },
        { key: 'requests', label: 'Req/s', type: 'number', align: 'right' },
        { key: 'healthy', label: 'Healthy', type: 'boolean', align: 'center' },
        { key: 'lastCheck', label: 'Last Check', type: 'date' },
      ],
      rows: [
        { host: 'api-prod-01', region: 'us-east-1', cpu: 72, mem: 61, requests: 1840, healthy: true,  lastCheck: '2024-03-31T10:00:00Z' },
        { host: 'api-prod-02', region: 'us-east-1', cpu: 45, mem: 58, requests: 1620, healthy: true,  lastCheck: '2024-03-31T10:00:00Z' },
        { host: 'api-prod-03', region: 'eu-west-1', cpu: 91, mem: 88, requests: 520,  healthy: false, lastCheck: '2024-03-31T09:58:00Z' },
        { host: 'api-prod-04', region: 'ap-east-1', cpu: 33, mem: 40, requests: 980,  healthy: true,  lastCheck: '2024-03-31T10:00:00Z' },
        { host: 'api-prod-05', region: 'eu-west-1', cpu: 12, mem: 28, requests: 310,  healthy: true,  lastCheck: '2024-03-31T10:00:00Z' },
      ],
    },
  },
]

function parsePayload(json: string): { payload: GridKitTablePayload; error: null } | { payload: null; error: string } {
  try {
    const parsed = JSON.parse(json)
    if (parsed?.type !== 'gridkit-table') return { payload: null, error: 'Missing or invalid "type": must be "gridkit-table"' }
    if (!Array.isArray(parsed.columns)) return { payload: null, error: '"columns" must be an array' }
    if (!Array.isArray(parsed.rows)) return { payload: null, error: '"rows" must be an array' }
    return { payload: parsed as GridKitTablePayload, error: null }
  } catch (e) {
    return { payload: null, error: (e as Error).message }
  }
}

export function AutoTableTab() {
  const [selected, setSelected] = useState(0)
  const [promptOpen, setPromptOpen] = useState(false)
  const [jsonText, setJsonText] = useState(() => JSON.stringify(PAYLOADS[0]!.payload, null, 2))

  function selectScenario(i: number) {
    setSelected(i)
    setJsonText(JSON.stringify(PAYLOADS[i]!.payload, null, 2))
  }

  const { payload, error } = parsePayload(jsonText)

  return (
    <section className="flex flex-col gap-4">

      {/* Description */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold">GridKitAutoTable</p>
        <p className="text-xs text-muted-foreground">
          Renders a <code className="rounded bg-muted px-1 py-0.5">GridKitTablePayload</code> — a
          structured JSON format that AI agents can produce — directly as a sortable DataGrid.
          Embed the System Prompt below into your LLM call, then pass the response JSON to{' '}
          <code className="rounded bg-muted px-1 py-0.5">&lt;GridKitAutoTable payload={'{...}'} /&gt;</code>.
          Edit the JSON on the left to see the table update live.
        </p>
      </div>

      {/* Sample selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Scenario:</span>
        {PAYLOADS.map((p, i) => (
          <button
            key={i}
            onClick={() => selectScenario(i)}
            className={`rounded border px-3 py-1 text-xs transition-colors ${
              i === selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-foreground hover:bg-muted'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* System Prompt accordion */}
      <div className="rounded border border-border">
        <button
          onClick={() => setPromptOpen((o) => !o)}
          className="flex w-full items-center justify-between px-3 py-2 text-xs font-medium text-foreground hover:bg-muted"
        >
          <span>System Prompt</span>
          <span className="text-muted-foreground">{promptOpen ? '▲' : '▼'}</span>
        </button>
        {promptOpen && (
          <pre className="border-t border-border bg-muted p-3 text-xs leading-relaxed">
            {SYSTEM_PROMPT}
          </pre>
        )}
      </div>

      {/* AI Response + Table side by side */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">AI Response — editable</p>
          <JsonEditor value={jsonText} height={400} onChange={setJsonText} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium text-muted-foreground">
            {payload?.title ?? 'Rendered Table'}
          </p>
          {error ? (
            <div className="flex h-[400px] items-start rounded border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          ) : (
            <GridKitAutoTable
              payload={payload!}
              enableSorting
              tableHeight={400}
              tableKey="auto-table-live"
            />
          )}
        </div>
      </div>

    </section>
  )
}

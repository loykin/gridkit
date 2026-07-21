import { useMemo, useState } from 'react'
import type React from 'react'
import type { Row } from '@tanstack/react-table'
import { Code2, Monitor } from 'lucide-react'
import {
  DataGrid,
  DataGridAgentChat,
  DataGridCard,
  DataGridPaginationBar,
  GlobalSearch,
  GridKitShell,
  useGridKitView,
} from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { CodeBlock } from '../components/CodeBlock'
import { ALL_DATA, type Employee } from '../data/employees'

type DemoTab = 'preview' | 'code'

function DemoTabs({ children, code }: { children: React.ReactNode; code: string }) {
  const [tab, setTab] = useState<DemoTab>('preview')
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-background">
      <div className="flex items-center gap-1 border-b border-border bg-muted/35 px-2 py-2">
        <button
          type="button"
          onClick={() => setTab('preview')}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            tab === 'preview'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
          }`}
        >
          <Monitor size={13} />
          Preview
        </button>
        <button
          type="button"
          onClick={() => setTab('code')}
          className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
            tab === 'code'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
          }`}
        >
          <Code2 size={13} />
          Code
        </button>
      </div>
      <div className={tab === 'preview' ? 'block' : 'hidden'}>
        {children}
      </div>
      <div className={tab === 'code' ? 'block p-3' : 'hidden'}>
        <CodeBlock code={code} height={320} />
      </div>
    </div>
  )
}

function ShowcasePanel({
  title,
  eyebrow,
  description,
  children,
  code,
}: {
  title: string
  eyebrow: string
  description: string
  children: React.ReactNode
  code: string
}) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex max-w-3xl flex-col gap-1.5">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{eyebrow}</p>
        <h2 className="text-xl font-semibold tracking-normal">{title}</h2>
        <p className="text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      <DemoTabs code={code}>{children}</DemoTabs>
    </section>
  )
}

const productRows = ALL_DATA.slice(0, 36).map((employee, index) => ({
  id: `SKU-${String(index + 1).padStart(4, '0')}`,
  name: `${employee.department} System ${index + 1}`,
  category: employee.department,
  price: 49 + index * 7,
  stock: 8 + (index * 13) % 70,
  status: index % 5 === 0 ? 'Low stock' : 'Active',
}))

const productColumns: DataGridColumnDef<(typeof productRows)[number]>[] = [
  { accessorKey: 'name', header: 'Product', meta: { filterType: 'text' } },
  { accessorKey: 'category', header: 'Category', meta: { filterType: 'select' } },
  { accessorKey: 'price', header: 'Price', meta: { align: 'right' } },
  { accessorKey: 'stock', header: 'Stock', meta: { align: 'right' } },
]

const adminColumns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'name', header: 'User', meta: { flex: 1.5, filterType: 'text' } },
  { accessorKey: 'department', header: 'Team', meta: { filterType: 'select' } },
  { accessorKey: 'role', header: 'Role', meta: { filterType: 'select' } },
  { accessorKey: 'status', header: 'Status', meta: { filterType: 'select' } },
  { accessorKey: 'score', header: 'Score', meta: { align: 'right', filterType: 'number' } },
]

const agentEvents = [
  { id: '1', type: 'message', role: 'user', content: 'Show the latest support backlog by priority.' },
  { id: '2', type: 'status', status: 'running', label: 'Querying incidents and accounts' },
  { id: '3', type: 'artifact', kind: 'table', title: 'Backlog summary', data: { rows: 42, stale: 6 } },
  { id: '4', type: 'message', role: 'assistant', content: 'High priority is concentrated in enterprise onboarding. Six items are stale.' },
] as const

function ProductCatalogDemo() {
  const [count, setCount] = useState(12)
  const visible = productRows.slice(0, count)
  return (
    <DataGridCard
      data={visible}
      columns={productColumns}
      enableColumnFilters
      filterDisplay="icon"
      containerHeight={360}
      minCardWidth={210}
      hasNextPage={count < productRows.length}
      fetchNextPage={() => setCount((value) => Math.min(value + 8, productRows.length))}
      headerRight={(table) => <GlobalSearch table={table} placeholder="Search catalog..." />}
      renderCard={(row) => (
        <div className="flex min-h-36 flex-col justify-between rounded-md border border-border bg-background p-3 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{row.original.name}</p>
              <p className="text-xs text-muted-foreground">{row.original.category}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium ${
              row.original.status === 'Low stock'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
            }`}
            >
              {row.original.status}
            </span>
          </div>
          <div className="mt-5 flex items-end justify-between border-t border-border pt-3">
            <span className="text-lg font-semibold">${row.original.price}</span>
            <span className="text-xs font-medium text-muted-foreground">{row.original.stock} stock</span>
          </div>
        </div>
      )}
    />
  )
}

function AdminUsersDemo() {
  const rows = ALL_DATA.slice(0, 80)
  return (
    <DataGrid
      data={rows}
      columns={adminColumns}
      enableColumnFilters
      filterDisplay="icon"
      pagination={{ pageSize: 12 }}
      tableHeight={360}
      checkboxConfig={{
        getRowId: (row) => String(row.id),
        selectedIds: new Set(),
        onSelectAll: () => undefined,
        onSelectOne: () => undefined,
      }}
      headerRight={(table) => <GlobalSearch table={table} placeholder="Search users..." />}
      footer={(table) => <DataGridPaginationBar table={table} pageSizes={[12, 24, 48]} />}
    />
  )
}

function AgentConsoleDemo() {
  return (
    <DataGridAgentChat
      events={agentEvents}
      containerHeight={340}
      headerRight={(table) => <GlobalSearch table={table} placeholder="Search events..." />}
    />
  )
}

function ThemeSwitcherDemo() {
  const [mode, setMode] = useState<'quiet' | 'dense' | 'contrast'>('quiet')
  const style = {
    quiet: {},
    dense: { '--gridkit-cell-padding-x': '8px' },
    contrast: { '--gridkit-primary': 'oklch(0.52 0.16 142)', '--gridkit-border': 'oklch(0.65 0.03 250)' },
  }[mode] as React.CSSProperties
  const rowHeight = mode === 'dense' ? 26 : 33

  return (
    <div className="flex flex-col gap-2" style={style}>
      <div className="flex gap-1">
        {(['quiet', 'dense', 'contrast'] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMode(item)}
            className={`rounded border px-2 py-1 text-xs ${mode === item ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}
          >
            {item}
          </button>
        ))}
      </div>
      <DataGrid data={ALL_DATA.slice(0, 24)} columns={adminColumns} tableHeight={320} rowHeight={rowHeight} />
    </div>
  )
}

const kanbanColumns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'name' },
  { accessorKey: 'department' },
  { accessorKey: 'status', meta: { filterType: 'select' } },
]

const kanbanStatuses = ['Active', 'On Leave', 'Terminated'] as const
type KanbanStatus = (typeof kanbanStatuses)[number]

function KanbanView({
  rows,
  onMove,
}: {
  rows: Row<Employee>[]
  onMove: (rowId: number, status: KanbanStatus) => void
}) {
  const groups = useMemo(() => {
    const map = new Map<string, Row<Employee>[]>()
    rows.forEach((row) => {
      const key = row.original.status
      map.set(key, [...(map.get(key) ?? []), row])
    })
    return kanbanStatuses.map((status) => ({ status, rows: map.get(status) ?? [] }))
  }, [rows])

  return (
    <div className="grid min-h-80 grid-cols-1 gap-3 p-3 md:grid-cols-3">
      {groups.map((group) => (
        <div
          key={group.status}
          className="flex flex-col gap-2 rounded-md border border-border bg-muted/35 p-2 transition-colors"
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault()
            const rowId = Number(event.dataTransfer.getData('text/gridkit-row-id'))
            if (Number.isFinite(rowId)) onMove(rowId, group.status)
          }}
        >
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>{group.status}</span>
            <span className="text-muted-foreground">{group.rows.length}</span>
          </div>
          {group.rows.slice(0, 6).map((row) => (
            <div
              key={row.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/gridkit-row-id', String(row.original.id))
              }}
              className="cursor-grab rounded-md border border-border bg-background p-2 text-xs shadow-sm active:cursor-grabbing"
            >
              <p className="font-medium">{row.original.name}</p>
              <p className="text-muted-foreground">{row.original.department}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

function CustomViewDemo() {
  const [boardRows, setBoardRows] = useState(() => ALL_DATA.slice(0, 48))
  const view = useGridKitView({
    data: boardRows,
    columns: kanbanColumns,
    enableColumnFilters: true,
    columnSizingMode: 'fixed',
  })
  const moveRow = (rowId: number, status: KanbanStatus) => {
    setBoardRows((current) =>
      current.map((row) => row.id === rowId ? { ...row, status } : row),
    )
  }

  return (
    <GridKitShell
      wrapperRef={view.wrapperRef}
      containerRef={view.containerRef}
      table={view.table}
      tableHeight={360}
      frameView="card"
      headerRight={(table) => <GlobalSearch table={table} placeholder="Search board..." />}
    >
      <KanbanView rows={view.rows} onMove={moveRow} />
    </GridKitShell>
  )
}

const codeSamples = {
  product: `import { DataGridCard, GlobalSearch } from '@loykin/gridkit'

export function ProductCatalog({ rows, columns, loadMore }) {
  return (
    <DataGridCard
      data={rows}
      columns={columns}
      enableColumnFilters
      filterDisplay="icon"
      containerHeight={360}
      minCardWidth={210}
      fetchNextPage={loadMore}
      headerRight={(table) => <GlobalSearch table={table} />}
      renderCard={(row) => <ProductCard product={row.original} />}
    />
  )
}`,
  admin: `import { DataGrid, DataGridPaginationBar, GlobalSearch } from '@loykin/gridkit'

export function AdminUsers({ users, columns, selection }) {
  return (
    <DataGrid
      data={users}
      columns={columns}
      checkboxConfig={selection}
      enableColumnFilters
      filterDisplay="icon"
      pagination={{ pageSize: 12 }}
      footer={(table) => <DataGridPaginationBar table={table} />}
      headerRight={(table) => <GlobalSearch table={table} />}
    />
  )
}`,
  agent: `import { DataGridAgentChat, GlobalSearch } from '@loykin/gridkit'

export function AgentConsole({ events }) {
  return (
    <DataGridAgentChat
      events={events}
      headerRight={(table) => <GlobalSearch table={table} />}
    />
  )
}`,
  theme: `export function ThemedGrid({ rows, columns, themeVars }) {
  return (
    <div style={themeVars}>
      <DataGrid data={rows} columns={columns} tableHeight={320} />
    </div>
  )
}`,
  custom: `import { useMemo, useState } from 'react'
import { GridKitShell, useGridKitView } from '@loykin/gridkit'

const statuses = ['Active', 'On Leave', 'Terminated']

function KanbanView({ rows, onMove }) {
  const groups = useMemo(() => {
    const map = new Map(statuses.map((status) => [status, []]))
    rows.forEach((row) => {
      map.get(row.original.status)?.push(row)
    })
    return statuses.map((status) => ({
      status,
      rows: map.get(status) ?? [],
    }))
  }, [rows])

  return (
    <div className="grid grid-cols-3 gap-3 p-3">
      {groups.map((group) => (
        <section
          key={group.status}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            const id = Number(event.dataTransfer.getData('text/row-id'))
            onMove(id, group.status)
          }}
        >
          <header>{group.status} ({group.rows.length})</header>
          {group.rows.map((row) => (
            <article
              key={row.id}
              draggable
              onDragStart={(event) => {
                event.dataTransfer.setData('text/row-id', String(row.original.id))
              }}
            >
              <strong>{row.original.name}</strong>
              <span>{row.original.department}</span>
            </article>
          ))}
        </section>
      ))}
    </div>
  )
}

export function CustomBoard({ data, columns }) {
  const [rows, setRows] = useState(data)
  const view = useGridKitView({
    data: rows,
    columns,
    enableColumnFilters: true,
    columnSizingMode: 'fixed',
  })
  const moveCard = (id, status) => {
    setRows((current) =>
      current.map((row) => row.id === id ? { ...row, status } : row),
    )
  }

  return (
    <GridKitShell
      wrapperRef={view.wrapperRef}
      containerRef={view.containerRef}
      table={view.table}
      tableHeight={360}
      frameView="card"
    >
      <KanbanView rows={view.rows} onMove={moveCard} />
    </GridKitShell>
  )
}`,
}

export function ShowcaseTab() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <div className="border-b border-border pb-5">
        <p className="text-xs font-semibold uppercase text-muted-foreground">GridKit Showcase</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-normal">Production-shaped grid patterns</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
          Scenario demos for the screens teams usually build: catalogs, admin tables, agent consoles, themed systems, and custom views.
        </p>
      </div>
      <ShowcasePanel
        eyebrow="Operations"
        title="Admin users"
        description="Dense table workflow with row selection, filtering, search, and footer pagination."
        code={codeSamples.admin}
      >
        <AdminUsersDemo />
      </ShowcasePanel>
      <ShowcasePanel
        eyebrow="Commerce"
        title="Shopping catalog"
        description="Card layout with toolbar search, column filters, responsive columns, and incremental loading."
        code={codeSamples.product}
      >
        <ProductCatalogDemo />
      </ShowcasePanel>
      <ShowcasePanel
        eyebrow="AI UI"
        title="Agent console"
        description="Agent event stream with searchable normalized events and artifact rendering."
        code={codeSamples.agent}
      >
        <AgentConsoleDemo />
      </ShowcasePanel>
      <ShowcasePanel
        eyebrow="Theming"
        title="Design system themes"
        description="The same grid under different token sets, without changing component code."
        code={codeSamples.theme}
      >
        <ThemeSwitcherDemo />
      </ShowcasePanel>
      <ShowcasePanel
        eyebrow="View SDK"
        title="Custom kanban view"
        description="A draggable board built from the public View SDK while keeping GridKit sorting, filtering, and search."
        code={codeSamples.custom}
      >
        <CustomViewDemo />
      </ShowcasePanel>
    </div>
  )
}

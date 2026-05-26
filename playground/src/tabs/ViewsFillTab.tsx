import { DataGridCard, DataGridList, DataGridChat, GlobalSearch, SelectFilter } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'name' },
  { accessorKey: 'department', meta: { filterType: 'select' } },
  { accessorKey: 'role' },
  { accessorKey: 'salary' },
  { accessorKey: 'status', meta: { filterType: 'select' } },
]

const STATUS_COLOR: Record<Employee['status'], string> = {
  Active: 'bg-green-100 text-green-800',
  'On Leave': 'bg-yellow-100 text-yellow-800',
  Terminated: 'bg-red-100 text-red-800',
}

function EmployeeCard({ e }: { e: Employee }) {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{e.name}</p>
          <p className="truncate text-xs text-muted-foreground">{e.role}</p>
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[e.status]}`}>
          {e.status}
        </span>
      </div>
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span className="truncate">{e.department}</span>
        <span>${e.salary.toLocaleString()}</span>
      </div>
    </div>
  )
}

function EmployeeListItem({ e }: { e: Employee }) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-4 py-3">
      <div className="flex-1 min-w-0">
        <p className="truncate text-sm font-medium">{e.name}</p>
        <p className="text-xs text-muted-foreground">{e.role} · {e.department}</p>
      </div>
      <span className="hidden sm:block text-sm text-muted-foreground">
        ${e.salary.toLocaleString()}
      </span>
    </div>
  )
}

// ── Messages for Chat ─────────────────────────────────────────────────────────

interface Msg { id: string; author: string; body: string; mine: boolean }

const CHAT_COLUMNS: DataGridColumnDef<Msg>[] = [
  { accessorKey: 'author' },
  { accessorKey: 'body' },
]

const MESSAGES: Msg[] = Array.from({ length: 30 }, (_, i) => ({
  id: String(i),
  author: i % 3 === 0 ? 'Alex' : i % 3 === 1 ? 'Sam' : 'You',
  body: ['Deployment looks stable', 'Any alerts?', 'All green. Latency is fine.', 'Rolling back now.', 'Confirmed.'][i % 5]!,
  mine: i % 3 === 2,
}))

// ── Tab ───────────────────────────────────────────────────────────────────────

const SHORT = ALL_DATA.slice(0, 5)

export function ViewsFillTab() {
  return (
    <div className="space-y-10">

      {/* ── fillContainer ──────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <p className="text-sm font-semibold">fillContainer — Card &amp; List</p>
          <p className="text-sm text-muted-foreground">
            Short data keeps natural height; long data scrolls inside the parent box.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">DataGridCard — short data</p>
            <div className="h-[380px] min-h-0 rounded border border-dashed border-border p-3">
              <DataGridCard
                fillContainer
                data={SHORT}
                columns={columns}
                minCardWidth={200}
                minColumns={2}
                renderCard={(row) => <EmployeeCard e={row.original} />}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">DataGridCard — long data</p>
            <div className="h-[380px] min-h-0 rounded border border-dashed border-border p-3">
              <DataGridCard
                fillContainer
                data={ALL_DATA}
                columns={columns}
                minCardWidth={200}
                minColumns={2}
                headerRight={(table) => <GlobalSearch table={table} placeholder="Search..." />}
                renderCard={(row) => <EmployeeCard e={row.original} />}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">DataGridList — short data</p>
            <div className="h-[380px] min-h-0 rounded border border-dashed border-border p-3">
              <DataGridList
                fillContainer
                data={SHORT}
                columns={columns}
                renderItem={(row) => <EmployeeListItem e={row.original} />}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">DataGridList — long data</p>
            <div className="h-[380px] min-h-0 rounded border border-dashed border-border p-3">
              <DataGridList
                fillContainer
                data={ALL_DATA}
                columns={columns}
                enableSorting
                headerLeft={(table) => <SelectFilter table={table} columnId="status" label="Status" />}
                headerRight={(table) => <GlobalSearch table={table} placeholder="Search..." />}
                renderItem={(row) => <EmployeeListItem e={row.original} />}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── fillParent ─────────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <p className="text-sm font-semibold">fillParent — Card, List &amp; Chat</p>
          <p className="text-sm text-muted-foreground">
            The view fills a parent-owned height. Parent must provide a real height with min-h-0.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">DataGridCard</p>
            <div className="h-[420px] min-h-0 overflow-hidden rounded border border-dashed border-border p-3">
              <DataGridCard
                fillParent
                data={ALL_DATA}
                columns={columns}
                minCardWidth={160}
                minColumns={2}
                renderCard={(row) => <EmployeeCard e={row.original} />}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">DataGridList</p>
            <div className="h-[420px] min-h-0 overflow-hidden rounded border border-dashed border-border p-3">
              <DataGridList
                fillParent
                data={ALL_DATA}
                columns={columns}
                enableSorting
                headerRight={(table) => <GlobalSearch table={table} placeholder="Search..." />}
                renderItem={(row) => <EmployeeListItem e={row.original} />}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">DataGridChat</p>
            <div className="h-[420px] min-h-0 overflow-hidden rounded border border-dashed border-border p-3">
              <DataGridChat
                fillParent
                data={MESSAGES}
                columns={CHAT_COLUMNS}
                getRowId={(row) => row.id}
                renderMessage={(row) => {
                  const m = row.original
                  return (
                    <div className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-lg px-3 py-2 text-sm ${
                        m.mine
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-foreground'
                      }`}>
                        {!m.mine && <p className="mb-0.5 text-xs font-medium opacity-70">{m.author}</p>}
                        <p>{m.body}</p>
                      </div>
                    </div>
                  )
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── fillContainer + Virtualization ─────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <p className="text-sm font-semibold">fillContainer + Virtualization</p>
          <p className="text-sm text-muted-foreground">
            fillContainer provides the scroll height; virtualization activates without explicit containerHeight.
          </p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              DataGridCard — {ALL_DATA.length} rows · virtualized
            </p>
            <div className="h-[420px] min-h-0 rounded border border-dashed border-border p-3">
              <DataGridCard
                fillContainer
                data={ALL_DATA}
                columns={columns}
                cardColumns={3}
                enableVirtualization
                estimateCardHeight={96}
                overscan={2}
                headerRight={(table) => <GlobalSearch table={table} placeholder="Search..." />}
                renderCard={(row) => <EmployeeCard e={row.original} />}
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              DataGridList — {ALL_DATA.length} rows · virtualized
            </p>
            <div className="h-[420px] min-h-0 rounded border border-dashed border-border p-3">
              <DataGridList
                fillContainer
                data={ALL_DATA}
                columns={columns}
                enableSorting
                enableVirtualization
                estimateRowHeight={57}
                overscan={6}
                headerRight={(table) => <GlobalSearch table={table} placeholder="Search..." />}
                renderItem={(row) => <EmployeeListItem e={row.original} />}
              />
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

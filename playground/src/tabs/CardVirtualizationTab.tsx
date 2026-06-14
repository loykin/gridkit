import { DataGridCard, GlobalSearch } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'name' },
  { accessorKey: 'department', meta: { filterType: 'select' } },
  { accessorKey: 'role', meta: { filterType: 'select' } },
  { accessorKey: 'salary' },
  { accessorKey: 'status', meta: { filterType: 'select' } },
]

const STATUS_COLOR: Record<Employee['status'], string> = {
  Active: 'bg-green-100 text-green-800',
  'On Leave': 'bg-yellow-100 text-yellow-800',
  Terminated: 'bg-red-100 text-red-800',
}

export function CardVirtualizationTab() {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs font-medium text-muted-foreground">
        Card row-group virtualization over {ALL_DATA.length} employees
      </p>
      <DataGridCard
        data={ALL_DATA}
        columns={columns}
        enableSorting
        containerHeight={420}
        cardColumns={3}
        enableVirtualization
        estimateCardHeight={132}
        overscan={2}
        emptyMessage="No employees found"
        headerRight={(table) => <GlobalSearch table={table} placeholder="Search virtualized cards..." />}
        renderCard={(row) => {
          const e = row.original
          return (
            <div className="flex h-[116px] flex-col justify-between rounded border border-border bg-card p-3">
              <div className="flex items-start justify-between gap-3">
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
                <span>Score {e.score}</span>
              </div>
            </div>
          )
        }}
      />
    </section>
  )
}

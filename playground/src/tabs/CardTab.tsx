import { useState } from 'react'
import { DataGridCard, GlobalSearch } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

const PAGE = 12

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

export function CardTab() {
  const [data, setData] = useState(() => ALL_DATA.slice(0, PAGE))
  const [isFetching, setIsFetching] = useState(false)
  const hasNextPage = data.length < ALL_DATA.length

  const fetchNextPage = () => {
    if (isFetching || !hasNextPage) return
    setIsFetching(true)
    setTimeout(() => {
      setData((prev) => ALL_DATA.slice(0, prev.length + PAGE))
      setIsFetching(false)
    }, 400)
  }

  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Card grid with filtering, sorting, and infinite scroll ({data.length} / {ALL_DATA.length} loaded)
      </p>
      <DataGridCard
        data={data}
        columns={columns}
        enableSorting
        minCardWidth={220}
        minColumns={2}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetching}
        fetchNextPage={fetchNextPage}
        emptyMessage="No employees found"
        rightFilters={(table) => <GlobalSearch table={table} placeholder="Search..." />}
        renderCard={(row) => {
          const e = row.original
          return (
            <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-sm">{e.name}</p>
                  <p className="text-xs text-muted-foreground">{e.role}</p>
                </div>
                <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[e.status]}`}>
                  {e.status}
                </span>
              </div>
              <div className="text-xs text-muted-foreground">{e.department}</div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">${e.salary.toLocaleString()}</span>
                <span className="text-xs text-muted-foreground">#{e.id}</span>
              </div>
            </div>
          )
        }}
      />
    </section>
  )
}

import { useState } from 'react'
import { DataGridCard, GlobalSearch, SelectFilter } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

const PAGE = 20

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'name' },
  { accessorKey: 'department', meta: { filterType: 'select' } },
  { accessorKey: 'role', meta: { filterType: 'select' } },
  { accessorKey: 'salary' },
  { accessorKey: 'status', meta: { filterType: 'select' } },
]

const STATUS_COLOR: Record<Employee['status'], string> = {
  Active: 'text-green-600',
  'On Leave': 'text-yellow-600',
  Terminated: 'text-red-500',
}

const DEPT_INITIAL: Record<string, string> = {
  Engineering: 'EN',
  Design: 'DS',
  Product: 'PD',
  Sales: 'SL',
  HR: 'HR',
  Finance: 'FN',
}

export function CardListTab() {
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
        Full-width list cards — Grafana datasource style ({data.length} / {ALL_DATA.length} loaded)
      </p>
      <DataGridCard
        data={data}
        columns={columns}
        enableSorting
        cardColumns={1}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetching}
        fetchNextPage={fetchNextPage}
        emptyMessage="No employees found"
        rowCursor
        leftFilters={(table) => (
          <>
            <SelectFilter table={table} columnId="department" label="Department" />
            <SelectFilter table={table} columnId="status" label="Status" />
          </>
        )}
        rightFilters={(table) => <GlobalSearch table={table} placeholder="Search..." />}
        renderCard={(row) => {
          const e = row.original
          return (
            <div className="flex items-center gap-4 border-b border-border px-4 py-3 hover:bg-accent transition-colors">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted text-xs font-bold text-muted-foreground">
                {DEPT_INITIAL[e.department] ?? '??'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{e.name}</p>
                <p className="text-xs text-muted-foreground">{e.role} · {e.department}</p>
              </div>
              <div className="hidden sm:block text-sm text-muted-foreground">
                ${e.salary.toLocaleString()}
              </div>
              <span className={`text-xs font-medium ${STATUS_COLOR[e.status]}`}>
                ● {e.status}
              </span>
            </div>
          )
        }}
      />
    </section>
  )
}

import { useState } from 'react'
import { DataGridInfinity } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

const PAGE = 50

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.5, filterType: 'number' } },
  { accessorKey: 'name', header: 'Name', meta: { flex: 2, filterType: 'text' } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.5, filterType: 'select' } },
  { accessorKey: 'role', header: 'Role', meta: { flex: 1.5, filterType: 'select' } },
  {
    accessorKey: 'salary',
    header: 'Salary',
    meta: { flex: 1, align: 'right' },
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 1, filterType: 'select' },
    cell: ({ row }) => {
      const s = row.original.status
      const color =
        s === 'Active'
          ? 'bg-green-100 text-green-800'
          : s === 'On Leave'
            ? 'bg-yellow-100 text-yellow-800'
            : 'bg-red-100 text-red-800'
      return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>
          {s}
        </span>
      )
    },
  },
]

export function InfinityTab() {
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
        Loads {PAGE} rows at a time on scroll ({data.length} / {ALL_DATA.length} loaded)
      </p>
      <DataGridInfinity
        data={data}
        columns={columns}
        enableColumnFilters
        enableSorting
        tableHeight={480}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetching}
        fetchNextPage={fetchNextPage}
        emptyMessage="No employees found"
        tableKey="infinity"
      />
    </section>
  )
}

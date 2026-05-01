import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', size: 80 },
  { accessorKey: 'name', header: 'Name', size: 200 },
  { accessorKey: 'department', header: 'Department', size: 180 },
  { accessorKey: 'role', header: 'Role', size: 180 },
  {
    accessorKey: 'salary',
    header: 'Salary',
    size: 140,
    meta: { align: 'right' },
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
  { accessorKey: 'startDate', header: 'Start Date', size: 130 },
  { accessorKey: 'score', header: 'Score', size: 100, meta: { align: 'right' } },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 130,
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

export function ColumnPinningTab() {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Click the pin icon in any header to pin/unpin columns at runtime. Scroll horizontally to verify sticky behavior.
      </p>
      <DataGrid
        data={ALL_DATA}
        columns={columns}
        columnSizingMode="fixed"
        enableSorting
        enableColumnPinning
        bordered
        tableHeight={500}
        pagination={{ pageSize: 20 }}
        footer={(table) => <DataGridPaginationBar table={table} pageSizes={[20, 50, 100]} />}
        emptyMessage="No employees found"
      />
    </section>
  )
}

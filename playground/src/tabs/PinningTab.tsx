import { DataGrid } from '@loykin/data-grid'
import type { DataGridColumnDef } from '@loykin/data-grid'
import { ALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id',         header: 'ID',          size: 80,  meta: { pin: 'left' } },
  { accessorKey: 'name',       header: 'Name',        size: 200, meta: { pin: 'left' } },
  { accessorKey: 'department', header: 'Department',  size: 200 },
  { accessorKey: 'role',       header: 'Role',        size: 200 },
  {
    accessorKey: 'salary',
    header: 'Salary',
    size: 150,
    meta: { align: 'right' },
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
  { accessorKey: 'startDate', header: 'Start Date', size: 150 },
  { accessorKey: 'score',     header: 'Score',      size: 120, meta: { align: 'right' } },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 150,
    meta: { pin: 'right' },
    cell: ({ row }) => {
      const s = row.original.status
      const color = s === 'Active' ? 'bg-green-100 text-green-800' : s === 'On Leave' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
      return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{s}</span>
    },
  },
]

export function PinningTab() {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        <strong>ID</strong>, <strong>Name</strong> — pinned left ·{' '}
        <strong>Status</strong> — pinned right · scroll horizontally to verify
      </p>
      <DataGrid
        data={ALL_DATA}
        columns={columns}
        columnSizingMode="fixed"
        enableSorting
        bordered
        tableHeight={500}
        pageSizes={[20, 50, 100]}
        emptyMessage="No employees found"
        tableKey="pinning"
      />
    </section>
  )
}

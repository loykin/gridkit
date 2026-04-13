import { DataGrid } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id',         header: 'ID',         meta: { flex: 0.5, filterType: 'number' } },
  { accessorKey: 'name',       header: 'Name',       meta: { flex: 2,   filterType: 'text' } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.5, filterType: 'select' } },
  { accessorKey: 'role',       header: 'Role',       meta: { flex: 1.5, filterType: 'select' } },
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
      const color = s === 'Active' ? 'bg-green-100 text-green-800' : s === 'On Leave' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
      return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{s}</span>
    },
  },
]

export function BorderedTab() {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Default — no column dividers</p>
        <DataGrid
          data={ALL_DATA}
          columns={columns}
          enableSorting
          enableColumnFilters
          pageSizes={[10, 20]}
          emptyMessage="No employees found"
          tableKey="bordered-default"
        />
      </div>
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-muted-foreground">Bordered — vertical dividers between columns</p>
        <DataGrid
          data={ALL_DATA}
          columns={columns}
          enableSorting
          enableColumnFilters
          bordered
          pageSizes={[10, 20]}
          emptyMessage="No employees found"
          tableKey="bordered-bordered"
        />
      </div>
    </section>
  )
}

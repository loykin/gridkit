import { DataGrid, ColumnVisibilityDropdown } from '@loykin/data-grid'
import type { DataGridColumnDef } from '@loykin/data-grid'
import { SMALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id',         header: 'ID',         meta: { flex: 0.5, filterType: 'number' } },
  { accessorKey: 'name',       header: 'Name',       meta: { flex: 2,   filterType: 'text' } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.5, filterType: 'select' } },
  { accessorKey: 'role',       header: 'Role',       meta: { flex: 1.5, filterType: 'select' } },
  {
    accessorKey: 'salary',
    header: 'Salary',
    meta: { flex: 1, align: 'right', filterType: 'number' },
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
  { accessorKey: 'startDate', header: 'Start Date', meta: { flex: 1,   filterType: 'text' } },
  { accessorKey: 'score',     header: 'Score',      meta: { flex: 0.8, align: 'right', filterType: 'number' } },
]

export function PaginationTab() {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        50 rows · enableColumnFilters · enableColumnVisibility · text / select / number range filters
      </p>
      <DataGrid
        data={SMALL_DATA}
        columns={columns}
        enableColumnFilters
        enableSorting
        rightFilters={(table) => <ColumnVisibilityDropdown table={table} />}
        pageSizes={[10, 20, 50]}
        emptyMessage="No employees found"
        tableKey="pagination"
      />
    </section>
  )
}

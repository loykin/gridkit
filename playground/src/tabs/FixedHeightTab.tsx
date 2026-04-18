import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

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
  { accessorKey: 'startDate', header: 'Start Date', meta: { flex: 1 } },
  { accessorKey: 'score', header: 'Score', meta: { flex: 0.8, align: 'right' } },
]

export function FixedHeightTab() {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        tableHeight=500 · sticky header · scrollable body · pagination pinned to bottom
      </p>
      <DataGrid
        data={ALL_DATA}
        columns={columns}
        enableColumnFilters
        enableSorting
        tableHeight={500}
        pagination={{ pageSize: 20 }}
        footer={(table) => <DataGridPaginationBar table={table} pageSizes={[20, 50, 100]} />}
        emptyMessage="No employees found"
        tableKey="fixed-height"
      />
    </section>
  )
}

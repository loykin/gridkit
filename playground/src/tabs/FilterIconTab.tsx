import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { SMALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.5, filterType: 'number' } },
  { accessorKey: 'name', header: 'Name', meta: { flex: 2, filterType: 'text' } },
  {
    accessorKey: 'department',
    header: 'Department',
    meta: { flex: 1.5, filterType: 'multi-select' },
  },
  { accessorKey: 'role', header: 'Role', meta: { flex: 1.5, filterType: 'select' } },
  {
    accessorKey: 'salary',
    header: 'Salary',
    meta: { flex: 1, align: 'right', filterType: 'number' },
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
  { accessorKey: 'startDate', header: 'Start Date', meta: { flex: 1, filterType: 'text' } },
  {
    accessorKey: 'score',
    header: 'Score',
    meta: { flex: 0.8, align: 'right', filterType: 'number' },
  },
]

export function FilterIconTab() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium">filterDisplay=&quot;row&quot; (default)</p>
        <p className="text-xs text-muted-foreground">
          text · select · multi-select · number — dedicated filter row below the header
        </p>
        <DataGrid
          data={SMALL_DATA}
          columns={columns}
          enableColumnFilters
          filterDisplay="row"
          enableSorting
          pagination={{ pageSize: 20 }}
          footer={(table) => <DataGridPaginationBar table={table} pageSizes={[10, 20, 50]} />}
          emptyMessage="No employees found"
          tableKey="filter-row"
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium">filterDisplay=&quot;icon&quot;</p>
        <p className="text-xs text-muted-foreground">
          text · select · multi-select · number — filter popover on header cell icon click
        </p>
        <DataGrid
          data={SMALL_DATA}
          columns={columns}
          enableColumnFilters
          filterDisplay="icon"
          enableSorting
          pagination={{ pageSize: 20 }}
          footer={(table) => <DataGridPaginationBar table={table} pageSizes={[10, 20, 50]} />}
          emptyMessage="No employees found"
          tableKey="filter-icon"
        />
      </section>
    </div>
  )
}

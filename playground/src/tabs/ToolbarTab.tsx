import { DataGrid, ColumnVisibilityDropdown, GlobalSearch, SelectFilter, MultiSelectFilter } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { SMALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id',        header: 'ID',         meta: { flex: 0.5 } },
  { accessorKey: 'name',      header: 'Name',       meta: { flex: 2 } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.5 } },
  { accessorKey: 'role',      header: 'Role',       meta: { flex: 1.5 } },
  {
    accessorKey: 'salary',
    header: 'Salary',
    meta: { flex: 1, align: 'right' },
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 1 },
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
  { accessorKey: 'startDate', header: 'Start Date', meta: { flex: 1 } },
  { accessorKey: 'score',     header: 'Score',      meta: { flex: 0.8, align: 'right' } },
]

export function ToolbarTab() {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        GlobalSearch · SelectFilter · MultiSelectFilter · ColumnVisibilityDropdown (View)
      </p>
      <DataGrid
        data={SMALL_DATA}
        columns={columns}
        enableSorting
        pageSizes={[10, 20, 50]}
        emptyMessage="No employees found"
        tableKey="toolbar"
        leftFilters={(table) => (
          <>
            <GlobalSearch table={table} placeholder="Search employees…" />
            <SelectFilter table={table} columnId="status" label="Status" />
            <MultiSelectFilter table={table} columnId="department" label="Department" />
          </>
        )}
        rightFilters={(table) => (
          <ColumnVisibilityDropdown table={table} />
        )}
      />
    </section>
  )
}

import { DataGrid } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
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
  { accessorKey: 'startDate', header: 'Start Date', meta: { flex: 1,   filterType: 'text' } },
  { accessorKey: 'score',     header: 'Score',      meta: { flex: 0.8, align: 'right', filterType: 'number' } },
]

export function FilterIconTab() {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        filterDisplay=&quot;icon&quot; · 필터 row 없이 헤더 셀 오른쪽 아이콘 클릭으로 필터
      </p>
      <DataGrid
        data={SMALL_DATA}
        columns={columns}
        enableColumnFilters
        filterDisplay="icon"
        enableSorting
        pageSizes={[10, 20, 50]}
        emptyMessage="No employees found"
        tableKey="filter-icon"
      />
    </section>
  )
}

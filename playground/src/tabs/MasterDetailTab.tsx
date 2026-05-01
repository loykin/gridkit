import { DataGrid, ExpandToggleCell, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { SMALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  {
    id: 'expand',
    size: 40,
    enableResizing: false,
    enableSorting: false,
    header: () => null,
    cell: ({ row }) => <ExpandToggleCell row={row} />,
  },
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.5 } },
  { accessorKey: 'name', header: 'Name', meta: { flex: 2 } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.5 } },
  { accessorKey: 'role', header: 'Role', meta: { flex: 1.5 } },
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
]

export function MasterDetailTab() {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Click the chevron to expand a detail panel below each row.
      </p>
      <DataGrid
        data={SMALL_DATA}
        columns={columns}
        enableSorting
        pagination={{ pageSize: 20 }}
        footer={(table) => <DataGridPaginationBar table={table} pageSizes={[10, 20, 50]} />}
        tableWidthMode="fill-last"
        emptyMessage="No employees found"
        renderDetailRow={(row) => {
          const emp = row.original as Employee
          return (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 24px' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dg-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Start Date</div>
                <div style={{ fontSize: 13 }}>{emp.startDate}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dg-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Score</div>
                <div style={{ fontSize: 13 }}>{emp.score}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--dg-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Employee ID</div>
                <div style={{ fontSize: 13 }}>EMP-{String(emp.id).padStart(4, '0')}</div>
              </div>
            </div>
          )
        }}
      />
    </section>
  )
}

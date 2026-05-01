import { DataGrid, useCSVExport, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import type { Table } from '@tanstack/react-table'
import { ALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
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
  { accessorKey: 'startDate', header: 'Start Date', meta: { flex: 1 } },
  { accessorKey: 'score', header: 'Score', meta: { flex: 0.8, align: 'right' } },
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

function ExportButton({ table }: { table: Table<Employee> }) {
  const exportCSV = useCSVExport(table, 'employees.csv')
  return (
    <button
      onClick={exportCSV}
      style={{
        padding: '4px 12px',
        fontSize: 12,
        fontWeight: 500,
        borderRadius: 'var(--dg-radius)',
        border: '1px solid var(--dg-border)',
        background: 'var(--dg-background)',
        color: 'var(--dg-foreground)',
        cursor: 'pointer',
      }}
    >
      Export CSV
    </button>
  )
}

export function ExportTab() {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Export the current filtered + sorted data to CSV. Hidden columns are excluded.
      </p>
      <DataGrid
        data={ALL_DATA}
        columns={columns}
        enableSorting
        pagination={{ pageSize: 20 }}
        footer={(table) => <DataGridPaginationBar table={table} pageSizes={[20, 50, 100]} />}
        tableWidthMode="fill-last"
        emptyMessage="No employees found"
        rightFilters={(table) => <ExportButton table={table as Table<Employee>} />}
      />
    </section>
  )
}

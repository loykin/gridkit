import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  {
    id: 'identity',
    header: 'Identity',
    columns: [
      { accessorKey: 'id', header: 'ID', meta: { flex: 0.5, filterType: 'number' } },
      { accessorKey: 'name', header: 'Name', meta: { flex: 2, filterType: 'text' } },
    ],
  },
  {
    id: 'organization',
    header: 'Organization',
    columns: [
      { accessorKey: 'department', header: 'Department', meta: { flex: 1.4, filterType: 'select' } },
      { accessorKey: 'role', header: 'Role', meta: { flex: 1.4, filterType: 'select' } },
      {
        accessorKey: 'status',
        header: 'Status',
        meta: { flex: 1, filterType: 'select' },
        cell: ({ getValue }) => {
          const status = getValue<Employee['status']>()
          return (
            <span
              className={`px-2 py-0.5 rounded text-xs ${
                status === 'Active'
                  ? 'bg-green-100 text-green-700'
                  : status === 'On Leave'
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-red-100 text-red-700'
              }`}
            >
              {status}
            </span>
          )
        },
      },
    ],
  },
  {
    id: 'metrics',
    header: 'Metrics',
    columns: [
      {
        accessorKey: 'salary',
        header: 'Salary',
        meta: { flex: 1, filterType: 'number', align: 'right' },
        cell: ({ getValue }) => `$${getValue<number>().toLocaleString()}`,
      },
      { accessorKey: 'score', header: 'Score', meta: { flex: 0.8, filterType: 'number', align: 'right' } },
      { accessorKey: 'startDate', header: 'Start Date', meta: { flex: 1, filterType: 'date-range' } },
    ],
  },
]

const columnsWithUngrouped: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.5, filterType: 'number' } },
  {
    id: 'organization',
    header: 'Organization',
    columns: [
      { accessorKey: 'department', header: 'Department', meta: { flex: 1.4, filterType: 'select' } },
      { accessorKey: 'role', header: 'Role', meta: { flex: 1.4, filterType: 'select' } },
    ],
  },
  {
    id: 'metrics',
    header: 'Metrics',
    columns: [
      {
        accessorKey: 'salary',
        header: 'Salary',
        meta: { flex: 1, filterType: 'number', align: 'right' },
        cell: ({ getValue }) => `$${getValue<number>().toLocaleString()}`,
      },
      { accessorKey: 'score', header: 'Score', meta: { flex: 0.8, filterType: 'number', align: 'right' } },
    ],
  },
  { accessorKey: 'startDate', header: 'Start Date', meta: { flex: 1, filterType: 'date-range' } },
]

export function HeaderGroupsTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Identity, Organization, and Metrics are header groups that span their child columns.
        Sorting/filtering applies to leaf headers; group headers resize the child column group.
      </p>
      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Padded - default header group layout
        </p>
        <DataGrid
          data={ALL_DATA}
          columns={columns}
          tableHeight={520}
          enableMultiSort
          maxMultiSortColCount={3}
          enableColumnFilters
          filterDisplay="icon"
          bordered
          pagination={{ pageSize: 50 }}
          footer={(table) => <DataGridPaginationBar table={table} pageSizes={[20, 50, 100]} />}
        />
      </div>

      <div className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">
          Span - ungrouped leaf columns span the full header height
        </p>
        <DataGrid
          data={ALL_DATA}
          columns={columnsWithUngrouped}
          headerGroupLayout="span"
          tableHeight={520}
          enableMultiSort
          maxMultiSortColCount={3}
          enableColumnFilters
          filterDisplay="icon"
          bordered
          pagination={{ pageSize: 50 }}
          footer={(table) => <DataGridPaginationBar table={table} pageSizes={[20, 50, 100]} />}
        />
      </div>
    </div>
  )
}

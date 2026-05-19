import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'
import { LayoutModeComparison } from './LayoutModeComparison'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.55, filterType: 'number' } },
  { accessorKey: 'name', header: 'Name', meta: { flex: 1.6, filterType: 'text' } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.2, filterType: 'select' } },
  { accessorKey: 'role', header: 'Role', meta: { flex: 1.2, filterType: 'select' } },
  { accessorKey: 'status', header: 'Status', meta: { flex: 0.9, filterType: 'select' } },
  {
    accessorKey: 'salary',
    header: 'Salary',
    meta: { flex: 1, filterType: 'number', align: 'right' },
    cell: ({ getValue }) => `$${getValue<number>().toLocaleString()}`,
  },
  { accessorKey: 'score', header: 'Score', meta: { flex: 0.75, filterType: 'number', align: 'right' } },
  { accessorKey: 'startDate', header: 'Start Date', meta: { flex: 1, filterType: 'date-range' } },
]

function ToolbarContent() {
  return (
    <div className="flex flex-wrap items-center gap-1 max-w-[520px]">
      {['Parent height', 'min-h-0', 'overflow hidden', 'body scroll'].map((label) => (
        <span key={label} className="rounded border border-border px-2 py-1 text-xs text-muted-foreground">
          {label}
        </span>
      ))}
    </div>
  )
}

export function FillParentTab() {
  const shortRows = ALL_DATA.slice(0, 6)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold">fillParent</p>
        <p className="text-sm text-muted-foreground">
          The grid fills a parent-owned height. Short and long data both keep the footer at the panel bottom.
        </p>
      </div>

      <LayoutModeComparison />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Short data - parent height filled</p>
          <div className="h-[420px] min-h-0 overflow-hidden rounded border border-dashed border-border p-3" data-testid="fill-parent-short-case">
            <DataGrid
              fillParent
              data={shortRows}
              columns={columns}
              bordered
              pagination={{ pageSize: 20 }}
              footer={(table) => <DataGridPaginationBar table={table} pageSizes={[10, 20, 50]} />}
            />
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Long data - virtualized body scroll</p>
          <div className="h-[420px] min-h-0 overflow-hidden rounded border border-dashed border-border p-3" data-testid="fill-parent-long-case">
            <DataGrid
              fillParent
              data={ALL_DATA}
              columns={columns}
              headerLeft={<ToolbarContent />}
              enableColumnFilters
              filterDisplay="row"
              bordered
              pagination={{ pageSize: 500 }}
              footer={(table) => <DataGridPaginationBar table={table} pageSizes={[100, 250, 500]} />}
            />
          </div>
        </section>
      </div>
    </div>
  )
}

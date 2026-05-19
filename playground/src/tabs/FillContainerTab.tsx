import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'
import { LayoutModeComparison } from './LayoutModeComparison'

const groupedColumns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.55, filterType: 'number' } },
  {
    id: 'identity',
    header: 'Identity',
    columns: [
      { accessorKey: 'name', header: 'Name', meta: { flex: 1.5, filterType: 'text' } },
      { accessorKey: 'status', header: 'Status', meta: { flex: 1, filterType: 'select' } },
    ],
  },
  {
    id: 'organization',
    header: 'Organization',
    columns: [
      { accessorKey: 'department', header: 'Department', meta: { flex: 1.3, filterType: 'select' } },
      { accessorKey: 'role', header: 'Role', meta: { flex: 1.3, filterType: 'select' } },
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

function ToolbarWrapProbe() {
  return (
    <div className="flex flex-wrap items-center gap-1 max-w-[520px]">
      {['Owned', 'Active', 'Critical', 'Backend', 'Deploying', 'SLO'].map((label) => (
        <span key={label} className="rounded border border-border px-2 py-1 text-xs text-muted-foreground">
          {label}
        </span>
      ))}
    </div>
  )
}

export function FillContainerTab() {
  const shortRows = ALL_DATA.slice(0, 4)

  return (
    <div className="space-y-5">
      <div>
        <p className="text-sm font-semibold">fillContainer</p>
        <p className="text-sm text-muted-foreground">
          Short data keeps natural table height; long data scrolls inside the body while the footer stays in the parent box.
        </p>
      </div>

      <LayoutModeComparison />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Short data - natural height</p>
          <div className="h-[420px] min-h-0 rounded border border-dashed border-border p-3" data-testid="fill-short-case">
            <DataGrid
              fillContainer
              data={shortRows}
              columns={groupedColumns}
              headerGroupLayout="span"
              enableColumnFilters
              filterDisplay="icon"
              bordered
              pagination={{ pageSize: 20 }}
              footer={(table) => <DataGridPaginationBar table={table} className="pt-2" pageSizes={[10, 20, 50]} />}
            />
          </div>
        </section>

        <section className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Long data - internal body scroll</p>
          <div className="h-[420px] min-h-0 rounded border border-dashed border-border p-3" data-testid="fill-long-case">
            <DataGrid
              fillContainer
              data={ALL_DATA}
              columns={groupedColumns}
              headerLeft={<ToolbarWrapProbe />}
              headerGroupLayout="span"
              enableColumnFilters
              filterDisplay="row"
              enableColumnPinning
              bordered
              pagination={{ pageSize: 100 }}
              footer={(table) => <DataGridPaginationBar table={table} className="pt-2" pageSizes={[50, 100, 200]} />}
            />
          </div>
        </section>
      </div>

      <section className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">No footer - bounded body only</p>
        <div className="h-[360px] min-h-0 rounded border border-dashed border-border p-3" data-testid="fill-no-footer-case">
          <DataGrid
            fillContainer
            data={ALL_DATA}
            columns={groupedColumns}
            headerLeft={<ToolbarWrapProbe />}
            headerGroupLayout="padded"
            enableColumnFilters
            filterDisplay="icon"
            bordered
          />
        </div>
      </section>
    </div>
  )
}

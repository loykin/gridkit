import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'
import { LayoutModeComparison } from './LayoutModeComparison'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.55 } },
  { accessorKey: 'name', header: 'Name', meta: { flex: 1.5 } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.1 } },
  { accessorKey: 'role', header: 'Role', meta: { flex: 1.1 } },
  { accessorKey: 'status', header: 'Status', meta: { flex: 0.9 } },
  { accessorKey: 'score', header: 'Score', meta: { flex: 0.75, align: 'right' } },
]

function ComparisonGrid({ long = false }: { long?: boolean }) {
  const data = long ? ALL_DATA : ALL_DATA.slice(0, 4)
  const pageSize = long ? 100 : 20

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">fillContainer</p>
        <div
          className="h-[360px] min-h-0 overflow-hidden rounded border border-dashed border-border p-3"
          data-testid={long ? 'layout-modes-container-long' : 'layout-modes-container-short'}
        >
          <DataGrid
            fillContainer
            data={data}
            columns={columns}
            bordered
            pagination={{ pageSize }}
            footer={(table) => <DataGridPaginationBar table={table} pageSizes={[20, 50, 100]} />}
          />
        </div>
      </section>

      <section className="space-y-2">
        <p className="text-xs font-medium text-muted-foreground">fillParent</p>
        <div
          className="h-[360px] min-h-0 overflow-hidden rounded border border-dashed border-border p-3"
          data-testid={long ? 'layout-modes-parent-long' : 'layout-modes-parent-short'}
        >
          <DataGrid
            fillParent
            data={data}
            columns={columns}
            bordered
            pagination={{ pageSize }}
            footer={(table) => <DataGridPaginationBar table={table} pageSizes={[20, 50, 100]} />}
          />
        </div>
      </section>
    </div>
  )
}

export function LayoutModesTab() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold">Layout Modes</p>
        <p className="text-sm text-muted-foreground">
          Same parent height and same data, shown side by side to compare fillContainer and fillParent.
        </p>
      </div>

      <LayoutModeComparison />

      <section className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Short data comparison</p>
        <ComparisonGrid />
      </section>

      <section className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Long data comparison</p>
        <ComparisonGrid long />
      </section>
    </div>
  )
}

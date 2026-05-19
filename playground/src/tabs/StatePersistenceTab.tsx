import { DataGrid, ColumnVisibilityDropdown, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef, GridKitPersistedState } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

const STORAGE_KEY = 'gridkit:playground:persisted-state'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.5, filterType: 'number' } },
  { accessorKey: 'name', header: 'Name', meta: { flex: 2, filterType: 'text' } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.4, filterType: 'select' } },
  { accessorKey: 'role', header: 'Role', meta: { flex: 1.4, filterType: 'select' } },
  {
    accessorKey: 'salary',
    header: 'Salary',
    meta: { flex: 1, filterType: 'number', align: 'right' },
    cell: ({ getValue }) => `$${getValue<number>().toLocaleString()}`,
  },
  { accessorKey: 'score', header: 'Score', meta: { flex: 0.8, align: 'right' } },
  { accessorKey: 'startDate', header: 'Start Date', meta: { flex: 1, filterType: 'date-range' } },
]

function loadState() {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) as Partial<GridKitPersistedState> : undefined
}

function saveState(_tableKey: string, state: Partial<GridKitPersistedState>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function StatePersistenceTab() {
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Resize, reorder, pin, hide columns, sort, or change page size. Refresh the page to restore
        the saved grid state from localStorage.
      </p>
      <div className="flex justify-end">
        <button
          className="px-3 py-1.5 rounded border border-border text-xs font-medium hover:bg-muted"
          onClick={() => {
            localStorage.removeItem(STORAGE_KEY)
            window.location.reload()
          }}
        >
          Reset saved state
        </button>
      </div>
      <DataGrid
        data={ALL_DATA}
        columns={columns}
        tableKey="state-persistence-demo"
        statePersistence={{
          load: loadState,
          save: saveState,
          debounce: 300,
          include: [
            'columnSizing',
            'columnOrder',
            'columnPinning',
            'columnVisibility',
            'sorting',
            'pageSize',
          ],
        }}
        tableHeight={520}
        enableColumnFilters
        filterDisplay="icon"
        enableColumnReordering
        enableColumnPinning
        headerRight={(table) => <ColumnVisibilityDropdown table={table} />}
        pagination={{ pageSize: 20 }}
        footer={(table) => <DataGridPaginationBar table={table} className="pt-2" pageSizes={[10, 20, 50, 100]} />}
      />
    </div>
  )
}

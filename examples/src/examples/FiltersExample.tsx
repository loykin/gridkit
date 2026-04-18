import {
  DataGrid,
  DataGridPaginationBar,
  GlobalSearch,
  SelectFilter,
  MultiSelectFilter,
  ColumnVisibilityDropdown,
} from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'

// ── Types & Data ───────────────────────────────────────────────────────────────

interface Employee {
  id: number
  name: string
  department: string
  role: string
  status: 'Active' | 'On Leave' | 'Inactive'
  salary: number
  score: number
}

const DEPARTMENTS = ['Engineering', 'Design', 'Marketing', 'Sales', 'HR']
const ROLES = ['Senior', 'Junior', 'Lead', 'Manager', 'Intern']
const STATUSES = ['Active', 'On Leave', 'Inactive'] as const

const DATA: Employee[] = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  name: `Employee ${i + 1}`,
  department: DEPARTMENTS[i % DEPARTMENTS.length]!,
  role: ROLES[i % ROLES.length]!,
  status: STATUSES[i % 3]!,
  salary: 40000 + (i % 15) * 5000,
  score: Math.round(60 + (i % 40)),
}))

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id',         header: 'ID',         meta: { flex: 0.4, filterType: 'number' } },
  { accessorKey: 'name',       header: 'Name',       meta: { flex: 2,   filterType: 'text' } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.5, filterType: 'multi-select' } },
  { accessorKey: 'role',       header: 'Role',       meta: { flex: 1.2, filterType: 'select' } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 1, filterType: 'select' },
    cell: ({ row }) => {
      const s = row.original.status
      const bg = s === 'Active' ? '#dcfce7' : s === 'On Leave' ? '#fef9c3' : '#f1f5f9'
      const color = s === 'Active' ? '#166534' : s === 'On Leave' ? '#854d0e' : '#64748b'
      return (
        <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: bg, color }}>
          {s}
        </span>
      )
    },
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    meta: { flex: 1, align: 'right', filterType: 'number' },
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
  { accessorKey: 'score', header: 'Score', meta: { flex: 0.7, align: 'right', filterType: 'number' } },
]

function Label({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
      {children}
    </p>
  )
}

// ── Example ────────────────────────────────────────────────────────────────────

export function FiltersExample() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

      {/* A. Filter row + toolbar */}
      <div>
        <Label>A. Filter row (filterDisplay="row") + toolbar controls</Label>
        <DataGrid
          data={DATA}
          columns={columns}
          enableSorting
          enableColumnFilters
          filterDisplay="row"
          pagination={{ pageSize: 10 }}
          leftFilters={(table) => (
            <>
              <GlobalSearch table={table} placeholder="Search employees…" />
              <SelectFilter table={table} columnId="status" label="Status" />
              <MultiSelectFilter table={table} columnId="department" label="Department" />
            </>
          )}
          rightFilters={(table) => <ColumnVisibilityDropdown table={table} />}
          footer={(table) => <DataGridPaginationBar table={table} pageSizes={[10, 20, 50]} />}
          tableHeight={420}
          emptyMessage="No employees found"
          tableKey="ex-filter-row"
        />
      </div>

      {/* B. Icon mode */}
      <div>
        <Label>B. Filter icon (filterDisplay="icon") — popover on header click</Label>
        <DataGrid
          data={DATA}
          columns={columns}
          enableSorting
          enableColumnFilters
          filterDisplay="icon"
          pagination={{ pageSize: 10 }}
          rightFilters={(table) => <ColumnVisibilityDropdown table={table} />}
          footer={(table) => <DataGridPaginationBar table={table} pageSizes={[10, 20, 50]} />}
          tableHeight={380}
          emptyMessage="No employees found"
          tableKey="ex-filter-icon"
        />
      </div>

    </div>
  )
}

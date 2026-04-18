import { DataGrid } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'

// ── Types ──────────────────────────────────────────────────────────────────────

interface User {
  id: number
  name: string
  email: string
  role: string
  status: 'Active' | 'Inactive'
  joined: string
}

// ── Data ───────────────────────────────────────────────────────────────────────

const ROLES = ['Admin', 'Editor', 'Viewer', 'Manager']
const STATUSES = ['Active', 'Inactive'] as const

const DATA: User[] = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  role: ROLES[i % ROLES.length]!,
  status: STATUSES[i % 2]!,
  joined: new Date(2022, i % 12, (i % 28) + 1).toLocaleDateString(),
}))

// ── Columns ────────────────────────────────────────────────────────────────────

const columns: DataGridColumnDef<User>[] = [
  { accessorKey: 'id',     header: 'ID',     meta: { flex: 0.4 } },
  { accessorKey: 'name',   header: 'Name',   meta: { flex: 1.5 } },
  { accessorKey: 'email',  header: 'Email',  meta: { flex: 2 } },
  { accessorKey: 'role',   header: 'Role',   meta: { flex: 1 } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 0.8 },
    cell: ({ row }) => (
      <span style={{
        display: 'inline-flex',
        padding: '2px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 500,
        background: row.original.status === 'Active' ? '#dcfce7' : '#f1f5f9',
        color:      row.original.status === 'Active' ? '#166534' : '#64748b',
      }}>
        {row.original.status}
      </span>
    ),
  },
  { accessorKey: 'joined', header: 'Joined', meta: { flex: 1 } },
]

// ── Example ────────────────────────────────────────────────────────────────────

export function BasicExample() {
  return (
    <DataGrid
      data={DATA}
      columns={columns}
      enableSorting
      bordered
      tableHeight={480}
      onRowClick={(row) => console.log('clicked', row)}
      rowCursor
      emptyMessage="No users found"
    />
  )
}

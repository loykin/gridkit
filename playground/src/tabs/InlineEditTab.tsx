import { useState } from 'react'
import { DataGrid } from '@loykin/gridkit'
import type { DataGridColumnDef, EditCellProps } from '@loykin/gridkit'
import { SMALL_DATA, type Employee } from '../data/employees'

function TextEditor({ value, onCommit, onCancel }: EditCellProps<Employee, string>) {
  return (
    <input
      autoFocus
      defaultValue={String(value ?? '')}
      style={{
        width: '100%',
        padding: '2px 6px',
        fontSize: 13,
        border: '1px solid var(--dg-ring)',
        borderRadius: 'calc(var(--dg-radius) * 0.5)',
        background: 'var(--dg-background)',
        color: 'var(--dg-foreground)',
        outline: 'none',
      }}
      onBlur={(e) => onCommit(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onCommit(e.currentTarget.value)
        if (e.key === 'Escape') onCancel()
      }}
    />
  )
}

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.5 } },
  {
    accessorKey: 'name',
    header: 'Name (editable)',
    meta: {
      flex: 2,
      editCell: (props) => <TextEditor {...props} />,
    },
  },
  {
    accessorKey: 'department',
    header: 'Department (editable)',
    meta: {
      flex: 1.5,
      editCell: (props) => <TextEditor {...props} />,
    },
  },
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

export function InlineEditTab() {
  const [data, setData] = useState(SMALL_DATA)
  const [log, setLog] = useState<string[]>([])

  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Double-click a highlighted cell (Name, Department) to edit inline. Press Enter or click away to commit. Escape cancels.
      </p>
      <DataGrid
        data={data}
        columns={columns}
        enableSorting
        tableWidthMode="fill-last"
        emptyMessage="No employees found"
        getRowId={(row) => String(row.id)}
        onCellValueChange={(rowId, columnId, value) => {
          setData((prev) =>
            prev.map((row) =>
              String(row.id) === rowId ? { ...row, [columnId]: value } : row,
            ),
          )
          setLog((prev) => [`[${rowId}] ${columnId} → "${value}"`, ...prev.slice(0, 4)])
        }}
      />
      {log.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <p className="text-xs font-medium text-muted-foreground mb-1">Recent edits:</p>
          {log.map((entry, i) => (
            <p key={i} className="text-xs text-muted-foreground font-mono">{entry}</p>
          ))}
        </div>
      )}
    </section>
  )
}

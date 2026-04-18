import { useState } from 'react'
import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
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

const PRESETS = [24, 33, 48, 64] as const

export function RowHeightTab() {
  const [rowHeight, setRowHeight] = useState(33)

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Row height:</span>
        <div className="flex gap-1">
          {PRESETS.map((h) => (
            <button
              key={h}
              onClick={() => setRowHeight(h)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                rowHeight === h
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {h}px
            </button>
          ))}
        </div>
        <input
          type="range"
          min={20}
          max={80}
          value={rowHeight}
          onChange={(e) => setRowHeight(Number(e.target.value))}
          className="w-32"
        />
        <span className="text-xs font-mono text-foreground w-10">{rowHeight}px</span>
      </div>

      <p className="text-xs text-muted-foreground">
        rowHeight={rowHeight} · CSS minHeight + virtualizer estimateSize both updated
      </p>

      <DataGrid
        data={ALL_DATA}
        columns={columns}
        enableSorting
        rowHeight={rowHeight}
        tableHeight={500}
        pagination={{ pageSize: 20 }}
        footer={(table) => <DataGridPaginationBar table={table} pageSizes={[20, 50]} />}
        emptyMessage="No employees found"
        tableKey="row-height"
      />
    </section>
  )
}

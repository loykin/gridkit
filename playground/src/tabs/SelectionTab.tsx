import { useState } from 'react'
import { DataGrid, ColumnVisibilityDropdown } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { SMALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id',         header: 'ID',         meta: { flex: 0.5 } },
  { accessorKey: 'name',       header: 'Name',       meta: { flex: 2 } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1.5 } },
  { accessorKey: 'role',       header: 'Role',       meta: { flex: 1.5 } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 1 },
    cell: ({ row }) => {
      const s = row.original.status
      const color = s === 'Active' ? 'bg-green-100 text-green-800' : s === 'On Leave' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
      return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}>{s}</span>
    },
  },
]

export function SelectionTab() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          checkboxConfig · {selectedIds.size} row(s) selected
        </p>
        {selectedIds.size > 0 && (
          <button
            onClick={() => setSelectedIds(new Set())}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            Clear selection
          </button>
        )}
      </div>
      <DataGrid
        data={SMALL_DATA}
        columns={columns}
        enableSorting
        rightFilters={(table) => <ColumnVisibilityDropdown table={table} />}
        pageSizes={[10, 20, 50]}
        emptyMessage="No employees found"
        tableKey="selection"
        checkboxConfig={{
          getRowId: (row) => String(row.id),
          selectedIds,
          onSelectAll: (rows, checked) => {
            setSelectedIds((prev) => {
              const next = new Set(prev)
              rows.forEach((r) => {
                if (checked) next.add(String(r.original.id))
                else next.delete(String(r.original.id))
              })
              return next
            })
          },
          onSelectOne: (id, checked) => {
            setSelectedIds((prev) => {
              const next = new Set(prev)
              if (checked) next.add(id)
              else next.delete(id)
              return next
            })
          },
        }}
      />
    </section>
  )
}

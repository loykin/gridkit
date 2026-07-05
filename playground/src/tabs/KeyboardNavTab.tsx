import { useState } from 'react'
import type React from 'react'
import { DataGrid, GlobalSearch } from '@loykin/gridkit'
import type { DataGridColumnDef, EditCellProps } from '@loykin/gridkit'
import { ALL_DATA, type Employee } from '../data/employees'

function TextEditor({ value, onCommit, onCancel }: EditCellProps<Employee, string>) {
  return (
    <input
      autoFocus
      defaultValue={String(value ?? '')}
      className="w-full rounded border border-ring bg-background px-1.5 py-0.5 text-xs text-foreground outline-none"
      onBlur={(event) => onCommit(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter') onCommit(event.currentTarget.value)
        if (event.key === 'Escape') onCancel()
      }}
    />
  )
}

const statusClass: Record<Employee['status'], string> = {
  Active: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  'On Leave': 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  Terminated: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
}

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.45, align: 'right' } },
  {
    accessorKey: 'name',
    header: 'Name',
    meta: { flex: 1.5, filterType: 'text', editCell: (props) => <TextEditor {...props} /> },
  },
  {
    accessorKey: 'department',
    header: 'Department',
    meta: { flex: 1.1, filterType: 'select', editCell: (props) => <TextEditor {...props} /> },
  },
  { accessorKey: 'role', header: 'Role', meta: { flex: 1.2, filterType: 'select' } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 0.9, filterType: 'select' },
    cell: ({ row }) => (
      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${statusClass[row.original.status]}`}>
        {row.original.status}
      </span>
    ),
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    meta: { flex: 0.9, align: 'right', filterType: 'number' },
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
]

export function KeyboardNavTab() {
  const [data, setData] = useState(() => ALL_DATA.slice(0, 160))
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [lastEdit, setLastEdit] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(true)
  const [accent, setAccent] = useState<'default' | 'blue' | 'red'>('default')
  const focusStyle = {
    default: {},
    blue: {
      '--gridkit-cell-focus-ring': 'oklch(0.62 0.18 250)',
      '--gridkit-cell-focus-background': 'color-mix(in oklab, oklch(0.62 0.18 250) 10%, var(--gridkit-background))',
    },
    red: {
      '--gridkit-cell-focus-ring': 'oklch(0.58 0.22 25)',
      '--gridkit-cell-focus-background': 'color-mix(in oklab, oklch(0.58 0.22 25) 10%, var(--gridkit-background))',
    },
  }[accent] as React.CSSProperties

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium">Keyboard navigation</p>
          <p className="text-xs text-muted-foreground">
            Arrow keys, Home/End/PageUp/PageDown, Enter edit, Escape cancel, Space select.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setEnabled((value) => !value)}
            className={`rounded border px-2 py-1 text-xs ${enabled ? 'border-primary bg-primary text-primary-foreground' : 'border-border text-muted-foreground'}`}
          >
            {enabled ? 'Navigation on' : 'Navigation off'}
          </button>
          {(['default', 'blue', 'red'] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setAccent(item)}
              className={`rounded border px-2 py-1 text-xs ${accent === item ? 'border-primary bg-muted text-foreground' : 'border-border text-muted-foreground'}`}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div style={focusStyle}>
        <DataGrid
          data={data}
          columns={columns}
          getRowId={(row) => String(row.id)}
          enableSorting
          enableColumnFilters
          enableKeyboardNavigation={enabled}
          filterDisplay="icon"
          tableHeight={520}
          tableWidthMode="fill-last"
          rowHeight={36}
          headerRight={(table) => <GlobalSearch table={table} placeholder="Search employees..." />}
          checkboxConfig={{
            getRowId: (row) => String(row.id),
            selectedIds,
            onSelectAll: (rows, checked) => {
              setSelectedIds((current) => {
                const next = new Set(current)
                rows.forEach((row) => {
                  const id = String(row.original.id)
                  if (checked) next.add(id)
                  else next.delete(id)
                })
                return next
              })
            },
            onSelectOne: (id, checked) => {
              setSelectedIds((current) => {
                const next = new Set(current)
                if (checked) next.add(id)
                else next.delete(id)
                return next
              })
            },
          }}
          onCellValueChange={(rowId, columnId, value) => {
            setData((current) =>
              current.map((row) =>
                String(row.id) === rowId ? { ...row, [columnId]: value } : row,
              ),
            )
            setLastEdit(`${columnId} edited on row ${rowId}`)
          }}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        {selectedIds.size} selected{lastEdit ? ` · ${lastEdit}` : ''}
      </p>
    </section>
  )
}

import { useState } from 'react'
import { DataGrid } from '@loykin/gridkit'
import type { ColumnMenuContext, DataGridColumnDef } from '@loykin/gridkit'
import type { Column, Table } from '@tanstack/react-table'
import { ALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    meta: { flex: 2, filterType: 'text' },
  },
  {
    accessorKey: 'department',
    header: 'Dept',
    meta: { filterType: 'select' },
  },
  {
    accessorKey: 'role',
    header: 'Role',
    meta: { filterType: 'text' },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 100,
    meta: { filterType: 'select' },
  },
  {
    accessorKey: 'salary',
    header: 'Salary',
    size: 110,
    meta: { align: 'right' },
    cell: ({ getValue }) => `$${getValue<number>().toLocaleString()}`,
  },
  {
    accessorKey: 'score',
    header: 'Score',
    size: 80,
    meta: { align: 'right' },
    cell: ({ getValue }) => getValue<number>().toFixed(1),
  },
]

function CustomMenu<T extends object>({
  col,
  close,
  ctx,
}: {
  col: Column<T>
  table: Table<T>
  close: () => void
  ctx: ColumnMenuContext
}) {
  const sorted = col.getIsSorted()
  const pinned = col.getIsPinned()

  return (
    <div style={{ padding: '4px 0' }}>
      <div style={{ padding: '4px 8px 6px', fontSize: 11, fontWeight: 600, color: 'var(--gridkit-muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {String(col.columnDef.header ?? col.id)}
      </div>
      {ctx.canSort && (
        <>
          <button className="gridkit-popover-option" data-active={sorted === 'asc' ? 'true' : undefined} onClick={() => { col.toggleSorting(false); close() }}>↑ Sort A → Z</button>
          <button className="gridkit-popover-option" data-active={sorted === 'desc' ? 'true' : undefined} onClick={() => { col.toggleSorting(true); close() }}>↓ Sort Z → A</button>
          {sorted && <button className="gridkit-popover-option" onClick={() => { col.clearSorting(); close() }}>✕ Clear Sort</button>}
          {ctx.canPin && <div className="gridkit-col-menu-divider" />}
        </>
      )}
      {ctx.canPin && (
        <>
          <button className="gridkit-popover-option" data-active={pinned === 'left' ? 'true' : undefined} onClick={() => { col.pin('left'); close() }}>← Pin Left</button>
          <button className="gridkit-popover-option" data-active={pinned === 'right' ? 'true' : undefined} onClick={() => { col.pin('right'); close() }}>→ Pin Right</button>
          {pinned && <button className="gridkit-popover-option" onClick={() => { col.pin(false); close() }}>Unpin</button>}
        </>
      )}
    </div>
  )
}

export function ColumnMenuTab() {
  const [mode, setMode] = useState<'default' | 'custom'>('default')

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Menu type:</span>
        {(['default', 'custom'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
              mode === m
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
            }`}
          >
            {m === 'default' ? 'Default' : 'Custom (renderColumnMenu)'}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {mode === 'default'
          ? 'Built-in menu: Sort / Filter / Pin in a single ⋮ per column. Replaces individual icons.'
          : 'Custom renderColumnMenu — swap in any component (shadcn, MUI, etc.) while keeping the trigger button.'}
      </p>

      <DataGrid
        key={mode}
        data={ALL_DATA.slice(0, 50)}
        columns={columns}
        tableHeight={400}
        enableColumnMenu
        enableColumnFilters={mode === 'default'}
        enableColumnPinning
        renderColumnMenu={
          mode === 'custom'
            ? (col, table, close, ctx) => <CustomMenu col={col} table={table} close={close} ctx={ctx} />
            : undefined
        }
      />
    </section>
  )
}

import { useState } from 'react'
import type { Table } from '@tanstack/react-table'
import {
  DataGrid,
  DataGridPaginationBar,
  DataGridPaginationCompact,
  ColumnVisibilityDropdown,
  GlobalSearch,
} from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { SMALL_DATA, ALL_DATA, type Employee } from '../data/employees'

// ── Shared columns ─────────────────────────────────────────────────────────────

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

// ── Server-side simulation ─────────────────────────────────────────────────────

const SERVER_TOTAL = ALL_DATA.length
const SERVER_PAGE_SIZE = 15

// ── Component ──────────────────────────────────────────────────────────────────

export function PaginationTab() {
  // Section C: external table instance
  const [externalTable, setExternalTable] = useState<Table<Employee> | null>(null)

  // Section D: server-side slice
  const [serverRows, setServerRows] = useState<Employee[]>(() =>
    ALL_DATA.slice(0, SERVER_PAGE_SIZE),
  )

  return (
    <div className="flex flex-col gap-12">

      {/* ── A. DataGridPaginationBar — footer ─────────────────────────────────
           Full-featured: rows-per-page dropdown + page info + 4 nav buttons.
           Standard placement below the grid via the footer render prop.       */}
      <section className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold">A. DataGridPaginationBar — footer</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Full bar · rows-per-page dropdown · "Page X of Y" ·{' '}
            <code className="bg-muted px-1 rounded text-[11px]">footer</code> render prop
          </p>
        </div>
        <DataGrid
          data={SMALL_DATA}
          columns={columns}
          enableSorting
          pagination={{ pageSize: 10 }}
          footer={(table) => (
            <DataGridPaginationBar table={table} pageSizes={[5, 10, 25, 50]} />
          )}
          emptyMessage="No employees"
          tableKey="pg-a"
        />
      </section>

      {/* ── B. DataGridPaginationCompact — toolbar ─────────────────────────────
           Minimal: prev/next buttons + "X / Y" only — fits the toolbar row.
           Injected via rightFilters alongside other toolbar controls.          */}
      <section className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold">B. DataGridPaginationCompact — toolbar</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Compact bar · no dropdown · toolbar-height-friendly ·{' '}
            <code className="bg-muted px-1 rounded text-[11px]">rightFilters</code> render prop
          </p>
        </div>
        <DataGrid
          data={SMALL_DATA}
          columns={columns}
          enableSorting
          pagination={{ pageSize: 10 }}
          leftFilters={(table) => (
            <>
              <GlobalSearch table={table} placeholder="Search…" />
              <ColumnVisibilityDropdown table={table} />
            </>
          )}
          rightFilters={(table) => <DataGridPaginationCompact table={table} />}
          emptyMessage="No employees"
          tableKey="pg-b"
        />
      </section>

      {/* ── C. External placement — onTableReady ───────────────────────────────
           table instance extracted via onTableReady and rendered outside
           the DataGrid entirely — place anywhere in the component tree.        */}
      <section className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold">C. External placement — onTableReady</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <code className="bg-muted px-1 rounded text-[11px]">onTableReady</code> exposes the
            table instance · pagination bar rendered above the grid · no footer / rightFilters
          </p>
        </div>
        {/* Pagination bar rendered above the grid, completely outside DataGrid */}
        {externalTable && (
          <DataGridPaginationBar table={externalTable} pageSizes={[5, 10, 25, 50]} />
        )}
        <DataGrid
          data={SMALL_DATA}
          columns={columns}
          enableSorting
          pagination={{ pageSize: 10 }}
          onTableReady={(t) => setExternalTable(t)}
          emptyMessage="No employees"
          tableKey="pg-c"
        />
      </section>

      {/* ── D. Server-side (manual pagination) ─────────────────────────────────
           pageCount controls total pages — TanStack does not slice rows.
           onPageChange fires on every page/size change so the caller fetches
           the correct slice. totalCount drives the "X–Y of N" display.        */}
      <section className="flex flex-col gap-3">
        <div>
          <p className="text-sm font-semibold">D. Server-side — manual pagination</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            <code className="bg-muted px-1 rounded text-[11px]">pageCount</code> +{' '}
            <code className="bg-muted px-1 rounded text-[11px]">onPageChange</code> ·{' '}
            <code className="bg-muted px-1 rounded text-[11px]">totalCount</code> for "X–Y of N"
            display · {SERVER_TOTAL} total rows · {SERVER_PAGE_SIZE} per page
          </p>
        </div>
        <DataGrid
          data={serverRows}
          columns={columns}
          enableSorting={false}
          pagination={{
            pageSize: SERVER_PAGE_SIZE,
            pageCount: Math.ceil(SERVER_TOTAL / SERVER_PAGE_SIZE),
            onPageChange: (pageIndex, size) => {
              setServerRows(ALL_DATA.slice(pageIndex * size, (pageIndex + 1) * size))
            },
          }}
          footer={(table) => (
            <DataGridPaginationBar table={table} totalCount={SERVER_TOTAL} />
          )}
          emptyMessage="No employees"
          tableKey="pg-d"
        />
      </section>

    </div>
  )
}

import { useState } from 'react'
import type { Table } from '@tanstack/react-table'
import {
  DataGrid,
  DataGridPaginationBar,
  DataGridPaginationCompact,
  DataGridPaginationPages,
} from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'

// ── Types & Data ───────────────────────────────────────────────────────────────

interface Product {
  id: number
  name: string
  category: string
  price: number
  stock: number
}

const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports']

const DATA: Product[] = Array.from({ length: 120 }, (_, i) => ({
  id: i + 1,
  name: `Product ${i + 1}`,
  category: CATEGORIES[i % CATEGORIES.length]!,
  price: Math.round((9.99 + i * 3.5) * 100) / 100,
  stock: (i * 7) % 200,
}))

const columns: DataGridColumnDef<Product>[] = [
  { accessorKey: 'id',       header: 'ID',       meta: { flex: 0.4 } },
  { accessorKey: 'name',     header: 'Name',     meta: { flex: 2 } },
  { accessorKey: 'category', header: 'Category', meta: { flex: 1.2 } },
  {
    accessorKey: 'price',
    header: 'Price',
    meta: { flex: 0.8, align: 'right' },
    cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
  },
  { accessorKey: 'stock', header: 'Stock', meta: { flex: 0.7, align: 'right' } },
]

function Label({ children }: { children: string }) {
  return (
    <p style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 8 }}>
      {children}
    </p>
  )
}

// ── Example ────────────────────────────────────────────────────────────────────

export function PaginationExample() {
  // Pattern C: external placement
  const [externalTable, setExternalTable] = useState<Table<Product> | null>(null)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>

      {/* A. DataGridPaginationBar — footer */}
      <div>
        <Label>A. DataGridPaginationBar — footer (rows-per-page + page info + nav)</Label>
        <DataGrid
          data={DATA}
          columns={columns}
          enableSorting
          pagination={{ pageSize: 10 }}
          footer={(table) => (
            <DataGridPaginationBar table={table} pageSizes={[5, 10, 25, 50]} />
          )}
          tableHeight={320}
          emptyMessage="No products"
          tableKey="ex-pg-bar"
        />
      </div>

      {/* B. DataGridPaginationPages — numbered pages in footer */}
      <div>
        <Label>{'B. DataGridPaginationPages — numbered pages (<< < 1 2 [3] … 12 > >>)'}</Label>
        <DataGrid
          data={DATA}
          columns={columns}
          enableSorting
          pagination={{ pageSize: 10 }}
          footer={(table) => <DataGridPaginationPages table={table} siblingCount={2} />}
          tableHeight={320}
          emptyMessage="No products"
          tableKey="ex-pg-pages"
        />
      </div>

      {/* C. DataGridPaginationCompact — toolbar */}
      <div>
        <Label>C. DataGridPaginationCompact — toolbar (compact nav, no dropdown)</Label>
        <DataGrid
          data={DATA}
          columns={columns}
          enableSorting
          pagination={{ pageSize: 10 }}
          rightFilters={(table) => <DataGridPaginationCompact table={table} />}
          tableHeight={320}
          emptyMessage="No products"
          tableKey="ex-pg-compact"
        />
      </div>

      {/* D. External placement via onTableReady */}
      <div>
        <Label>D. External placement — onTableReady (pagination rendered above the grid)</Label>
        {externalTable && (
          <DataGridPaginationBar table={externalTable} pageSizes={[5, 10, 25, 50]} />
        )}
        <DataGrid
          data={DATA}
          columns={columns}
          enableSorting
          pagination={{ pageSize: 10 }}
          onTableReady={(t) => setExternalTable(t)}
          tableHeight={320}
          emptyMessage="No products"
          tableKey="ex-pg-external"
        />
      </div>

    </div>
  )
}

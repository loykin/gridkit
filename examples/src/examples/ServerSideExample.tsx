import { useEffect, useRef, useState } from 'react'
import type { SortingState } from '@tanstack/react-table'
import {
  DataGrid,
  DataGridPaginationBar,
  GlobalSearch,
} from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'

// ── Types ──────────────────────────────────────────────────────────────────────

interface Order {
  id: string
  customer: string
  product: string
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled'
  amount: number
  date: string
}

// ── Fake backend ───────────────────────────────────────────────────────────────

const CUSTOMERS = ['Alice', 'Bob', 'Carol', 'Dave', 'Eve', 'Frank', 'Grace', 'Henry']
const PRODUCTS  = ['Widget A', 'Widget B', 'Gadget X', 'Gadget Y', 'Tool Z']
const STATUSES  = ['Pending', 'Shipped', 'Delivered', 'Cancelled'] as const

const ALL_ORDERS: Order[] = Array.from({ length: 200 }, (_, i) => ({
  id: `ORD-${String(i + 1).padStart(4, '0')}`,
  customer: CUSTOMERS[i % CUSTOMERS.length]!,
  product:  PRODUCTS[i % PRODUCTS.length]!,
  status:   STATUSES[i % STATUSES.length]!,
  amount:   Math.round((19.99 + (i % 20) * 15.5) * 100) / 100,
  date:     new Date(2024, i % 12, (i % 28) + 1).toLocaleDateString(),
}))

interface FetchParams {
  pageIndex: number
  pageSize: number
  sorting: SortingState
  globalFilter: string
  statusFilter: string | undefined
}

function fakeBackend(params: FetchParams): Promise<{ rows: Order[]; total: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      let result = [...ALL_ORDERS]

      // Apply global filter
      if (params.globalFilter) {
        const q = params.globalFilter.toLowerCase()
        result = result.filter(
          (o) =>
            o.id.toLowerCase().includes(q) ||
            o.customer.toLowerCase().includes(q) ||
            o.product.toLowerCase().includes(q),
        )
      }

      // Apply status filter
      if (params.statusFilter) {
        result = result.filter((o) => o.status === params.statusFilter)
      }

      // Apply sorting
      if (params.sorting.length > 0) {
        const { id, desc } = params.sorting[0]!
        result.sort((a, b) => {
          const av = a[id as keyof Order]
          const bv = b[id as keyof Order]
          const cmp = av < bv ? -1 : av > bv ? 1 : 0
          return desc ? -cmp : cmp
        })
      }

      const total = result.length
      const rows  = result.slice(
        params.pageIndex * params.pageSize,
        (params.pageIndex + 1) * params.pageSize,
      )
      resolve({ rows, total })
    }, 120)
  })
}

// ── Columns ────────────────────────────────────────────────────────────────────

const columns: DataGridColumnDef<Order>[] = [
  { accessorKey: 'id',       header: 'Order ID', meta: { flex: 1 } },
  { accessorKey: 'customer', header: 'Customer', meta: { flex: 1.2 } },
  { accessorKey: 'product',  header: 'Product',  meta: { flex: 1.5 } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 1 },
    cell: ({ row }) => {
      const s = row.original.status
      const map: Record<string, { bg: string; color: string }> = {
        Pending:   { bg: '#fef9c3', color: '#854d0e' },
        Shipped:   { bg: '#dbeafe', color: '#1e40af' },
        Delivered: { bg: '#dcfce7', color: '#166534' },
        Cancelled: { bg: '#fee2e2', color: '#991b1b' },
      }
      const { bg, color } = map[s]!
      return (
        <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: bg, color }}>
          {s}
        </span>
      )
    },
  },
  {
    accessorKey: 'amount',
    header: 'Amount',
    meta: { flex: 0.8, align: 'right' },
    cell: ({ row }) => `$${row.original.amount.toFixed(2)}`,
  },
  { accessorKey: 'date', header: 'Date', meta: { flex: 1 } },
]

// ── Example ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

export function ServerSideExample() {
  const [rows, setRows]           = useState<Order[]>([])
  const [totalCount, setTotal]    = useState(0)
  const [isLoading, setLoading]   = useState(true)
  const [sorting, setSorting]     = useState<SortingState>([])
  const [globalFilter, setFilter] = useState('')
  const [statusFilter, setStatus] = useState<string | undefined>(undefined)

  // Stable ref avoids stale closures in fetch
  const fetchRef = useRef({ sorting, globalFilter, statusFilter })
  fetchRef.current = { sorting, globalFilter, statusFilter }

  async function load(pageIndex: number) {
    setLoading(true)
    const { rows: r, total } = await fakeBackend({
      pageIndex,
      pageSize: PAGE_SIZE,
      ...fetchRef.current,
    })
    setRows(r)
    setTotal(total)
    setLoading(false)
  }

  // Reload from page 0 when filters or sorting change
  useEffect(() => { load(0) }, [sorting, globalFilter, statusFilter]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <DataGrid
      data={rows}
      columns={columns}
      isLoading={isLoading}
      // Sorting — manual (server handles it)
      manualSorting
      onSortingChange={(s) => setSorting(s)}
      // Filtering — manual (server handles it)
      manualFiltering
      globalFilter={globalFilter}
      onGlobalFilterChange={(v) => setFilter(v)}
      // Toolbar
      leftFilters={(table) => (
        <>
          <GlobalSearch table={table} placeholder="Search orders…" />
          <select
            value={statusFilter ?? ''}
            onChange={(e) => setStatus(e.target.value || undefined)}
            className="dg-select"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </>
      )}
      // Pagination — manual (server handles slicing)
      pagination={{
        pageSize: PAGE_SIZE,
        pageCount: Math.ceil(totalCount / PAGE_SIZE),
        onPageChange: (pageIndex) => load(pageIndex),
      }}
      footer={(table) => (
        <DataGridPaginationBar table={table} totalCount={totalCount} />
      )}
      tableHeight={480}
      emptyMessage="No orders found"
      tableKey="ex-server"
    />
  )
}

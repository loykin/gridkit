import { useState } from 'react'
import { DataGridDrag, DragHandleCell } from '@loykin/data-grid'
import type { DataGridColumnDef } from '@loykin/data-grid'
import { SERVICES, type ServiceRow } from '../data/services'

const STATUS_STYLE: Record<ServiceRow['status'], string> = {
  healthy:  'bg-green-100 text-green-700',
  degraded: 'bg-yellow-100 text-yellow-700',
  down:     'bg-red-100 text-red-700',
}

const columns: DataGridColumnDef<ServiceRow>[] = [
  {
    id: 'drag',
    size: 36,
    enableResizing: false,
    enableSorting: false,
    header: () => null,
    meta: { filterType: false },
    cell: () => <DragHandleCell />,
  },
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Service',
    meta: { flex: 3 },
  },
  {
    id: 'status',
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 1 },
    cell: ({ row }) => (
      <span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[row.original.status]}`}>
        {row.original.status}
      </span>
    ),
  },
  {
    id: 'latency',
    accessorKey: 'latency',
    header: 'Latency (ms)',
    size: 120,
    meta: { align: 'right' },
    cell: ({ row }) => (
      <span className="text-muted-foreground tabular-nums">
        {row.original.latency > 0 ? `${row.original.latency} ms` : '—'}
      </span>
    ),
  },
  {
    id: 'owner',
    accessorKey: 'owner',
    header: 'Owner',
    meta: { flex: 1 },
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{row.original.owner}</span>
    ),
  },
]

export function DragTab() {
  const [data, setData] = useState(SERVICES)

  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        Drag the grip handle to reorder rows. Order is persisted in local state.
      </p>
      <DataGridDrag
        data={data}
        columns={columns}
        getRowId={(row) => row.id}
        onRowReorder={setData}
        tableWidthMode="fill-last"
        rowHeight={36}
        emptyMessage="No services"
      />
    </section>
  )
}

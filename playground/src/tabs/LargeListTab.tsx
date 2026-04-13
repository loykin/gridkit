import { DataGrid } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { RESOURCE_DATA, type Resource } from '../data/resources'

const STATUS_STYLE: Record<Resource['status'], string> = {
  Running:          'bg-green-100 text-green-800',
  Completed:        'bg-blue-100 text-blue-800',
  Pending:          'bg-yellow-100 text-yellow-800',
  Failed:           'bg-red-100 text-red-800',
  CrashLoopBackOff: 'bg-orange-100 text-orange-800',
}

const columns: DataGridColumnDef<Resource>[] = [
  { accessorKey: 'name',      header: 'Name',      meta: { minWidth: 160, flex: 2 } },
  { accessorKey: 'namespace', header: 'Namespace', meta: { minWidth: 120, flex: 1, filterType: 'select' } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { minWidth: 140, flex: 1, filterType: 'select' },
    cell: ({ row }) => {
      const s = row.original.status
      return <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s]}`}>{s}</span>
    },
  },
  {
    accessorKey: 'tags',
    header: 'Tags',
    meta: { minWidth: 200, flex: 3, wrap: true },
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1 py-0.5">
        {row.original.tags.map((tag) => (
          <span key={tag} className="inline-flex rounded px-1.5 py-0.5 text-xs font-medium bg-muted text-muted-foreground">{tag}</span>
        ))}
      </div>
    ),
  },
  {
    accessorKey: 'description',
    header: 'Description',
    meta: { minWidth: 260, flex: 4, wrap: true },
    cell: ({ row }) => (
      <p className="text-xs text-muted-foreground leading-relaxed py-0.5">{row.original.description}</p>
    ),
  },
  { accessorKey: 'cpu',      header: 'CPU',      meta: { minWidth: 70,  flex: 0.6, align: 'right' } },
  { accessorKey: 'memory',   header: 'Memory',   meta: { minWidth: 80,  flex: 0.8, align: 'right' } },
  { accessorKey: 'restarts', header: 'Restarts', meta: { minWidth: 70,  flex: 0.6, align: 'right', filterType: 'number' } },
  { accessorKey: 'age',      header: 'Age',      meta: { minWidth: 60,  flex: 0.6, align: 'right' } },
]

export function LargeListTab() {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        300 rows · no pagination · virtualizer auto-enabled ·{' '}
        <strong>Tags</strong> and <strong>Description</strong> columns wrap to multiple lines
      </p>
      <DataGrid
        data={RESOURCE_DATA}
        columns={columns}
        enablePagination={false}
        enableSorting
        enableColumnFilters
        bordered
        tableHeight={560}
        emptyMessage="No resources found"
        tableKey="large-list"
      />
    </section>
  )
}

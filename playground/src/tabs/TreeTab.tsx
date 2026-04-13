import { DataGrid, TreeCell } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { LayoutDashboard, Folder, Star, LayoutGrid } from 'lucide-react'
import { DASHBOARD_TREE, type DashboardItem } from '../data/dashboards'

const TAG_COLORS: Record<string, string> = {
  prod:    'bg-blue-100 text-blue-700',
  staging: 'bg-yellow-100 text-yellow-700',
  k8s:     'bg-purple-100 text-purple-700',
  db:      'bg-orange-100 text-orange-700',
  api:     'bg-green-100 text-green-700',
  infra:   'bg-gray-100 text-gray-700',
  alerts:  'bg-red-100 text-red-700',
  metrics: 'bg-teal-100 text-teal-700',
}

const columns: DataGridColumnDef<DashboardItem>[] = [
  {
    id: 'name',
    accessorKey: 'name',
    header: 'Name',
    meta: { flex: 3 },
    cell: ({ row }) => {
      const isGroup = row.original.type === 'group'
      return (
        <TreeCell row={row} indentSize={20}>
          {isGroup
            ? <Folder className="h-4 w-4 shrink-0 text-muted-foreground" />
            : <LayoutDashboard className="h-4 w-4 shrink-0 text-muted-foreground/60" />
          }
          <span className={`truncate ${isGroup ? 'font-medium' : ''}`}>
            {row.original.name}
          </span>
        </TreeCell>
      )
    },
  },

  {
    id: 'tags',
    accessorKey: 'tags',
    header: 'Tags',
    meta: { flex: 2 },
    cell: ({ row }) => (
      <div className="flex flex-wrap gap-1">
        {row.original.tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ${TAG_COLORS[tag] ?? 'bg-muted text-muted-foreground'}`}
          >
            {tag}
          </span>
        ))}
      </div>
    ),
  },

  {
    id: 'starred',
    accessorKey: 'starred',
    header: 'Starred',
    size: 72,
    meta: { align: 'center' },
    cell: ({ row }) =>
      row.original.starred
        ? <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        : null,
  },

  {
    id: 'panels',
    accessorKey: 'panels',
    header: 'Panels',
    size: 72,
    meta: { align: 'right' },
    cell: ({ row }) => {
      if (row.original.type === 'group') return null
      return (
        <span className="flex items-center justify-end gap-1 text-muted-foreground">
          <LayoutGrid className="h-3 w-3" />
          {row.original.panels}
        </span>
      )
    },
  },

  {
    id: 'lastViewed',
    accessorKey: 'lastViewed',
    header: 'Last Viewed',
    meta: { flex: 1 },
    cell: ({ row }) => (
      <span className="text-muted-foreground text-xs">{row.original.lastViewed}</span>
    ),
  },
]

export function TreeTab() {
  return (
    <section className="flex flex-col gap-2">
      <p className="text-xs text-muted-foreground">
        3-depth tree: Group → Subgroup → Dashboard. Standalone dashboards appear at root level without a toggle.
      </p>
      <DataGrid
        data={DASHBOARD_TREE}
        columns={columns}
        enableExpanding
        getSubRows={(row) => row.children}
        enableSorting={false}
        enablePagination={false}
        emptyMessage="No dashboards"
        tableWidthMode="fill-last"
        rowHeight={36}
        onRowClick={(row) => {
          if (row.type !== 'group') {
            alert(`Open: ${row.name}`)
          }
        }}
      />
    </section>
  )
}

import { DataGrid } from '@loykin/gridkit'
import type { DataGridColumnDef, DataGridIcons } from '@loykin/gridkit'
import {
  Star, StarOff, ChevronsUpDown,
  Search, Trash2,
  SkipBack, SkipForward, StepBack, StepForward,
  SlidersVertical, ListFilter, XCircle,
} from 'lucide-react'
import { SMALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id', header: 'ID', meta: { flex: 0.5, filterType: 'number' } },
  { accessorKey: 'name', header: 'Name', meta: { flex: 2, filterType: 'text' } },
  { accessorKey: 'department', header: 'Dept', meta: { flex: 1.5, filterType: 'multi-select' } },
  { accessorKey: 'role', header: 'Role', meta: { flex: 1.5, filterType: 'select' } },
  {
    accessorKey: 'salary',
    header: 'Salary',
    meta: { flex: 1, align: 'right' },
    cell: ({ row }) => `$${row.original.salary.toLocaleString()}`,
  },
]

const customIcons: DataGridIcons = {
  sortAsc: <Star size={12} />,
  sortDesc: <StarOff size={12} />,
  sortNone: <ChevronsUpDown size={12} />,
  filter: <ListFilter size={13} />,
  filterRange: <SlidersVertical size={13} />,
  clearFilter: <XCircle size={13} />,
  search: <Search size={13} />,
  pageFirst: <SkipBack size={14} />,
  pagePrev: <StepBack size={14} />,
  pageNext: <StepForward size={14} />,
  pageLast: <SkipForward size={14} />,
  rowActions: <Trash2 size={13} />,
}

export function IconsTab() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium">Default icons</p>
        <p className="text-xs text-muted-foreground">Built-in lucide-react icons</p>
        <DataGrid
          data={SMALL_DATA}
          columns={columns}
          enableColumnFilters
          filterDisplay="icon"
          enableSorting
          pageSizes={[5, 10, 20]}
          tableKey="icons-default"
        />
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-sm font-medium">Custom icons via <code className="text-xs bg-muted px-1 py-0.5 rounded">icons</code> prop</p>
        <p className="text-xs text-muted-foreground">
          sortAsc/sortDesc → Star/StarOff, clearFilter → XCircle, pagination → Skip/Step icons
        </p>
        <DataGrid
          data={SMALL_DATA}
          columns={columns}
          enableColumnFilters
          filterDisplay="icon"
          enableSorting
          pageSizes={[5, 10, 20]}
          icons={customIcons}
          tableKey="icons-custom"
        />
      </section>
    </div>
  )
}

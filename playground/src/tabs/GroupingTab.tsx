import { useState } from 'react'
import { DataGrid } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import type { GroupingState, Row } from '@tanstack/react-table'
import { ALL_DATA, type Employee } from '../data/employees'

const STATUS_COLORS: Record<Employee['status'], string> = {
  Active: 'bg-green-100 text-green-700',
  'On Leave': 'bg-yellow-100 text-yellow-700',
  Terminated: 'bg-red-100 text-red-700',
}

const columns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'name', header: 'Name', meta: { flex: 2 } },
  { accessorKey: 'department', header: 'Department', meta: { flex: 1 } },
  { accessorKey: 'role', header: 'Role', meta: { flex: 1 } },
  {
    accessorKey: 'status',
    header: 'Status',
    size: 110,
    cell: ({ getValue }) => {
      const v = getValue<Employee['status']>()
      return (
        <span className={`inline-flex rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_COLORS[v]}`}>
          {v}
        </span>
      )
    },
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

const GROUP_OPTIONS: { label: string; value: GroupingState }[] = [
  { label: 'Department', value: ['department'] },
  { label: 'Status', value: ['status'] },
  { label: 'Department → Status', value: ['department', 'status'] },
]

function GroupRowLabel({ row }: { row: Row<Employee> }) {
  const employees = row.subRows.flatMap((r) =>
    r.getIsGrouped() ? r.subRows : [r]
  )
  const count = employees.length
  const avgSalary = count > 0
    ? Math.round(employees.reduce((s, r) => s + r.original.salary, 0) / count)
    : 0
  const avgScore = count > 0
    ? (employees.reduce((s, r) => s + r.original.score, 0) / count).toFixed(1)
    : '—'

  return (
    <div className="flex items-center gap-3 flex-1 min-w-0">
      <span className="font-semibold text-foreground">{String(row.groupingValue)}</span>
      <span className="text-xs text-muted-foreground">{count} people</span>
      <span className="ml-auto flex items-center gap-3 text-xs text-muted-foreground shrink-0">
        <span>avg salary <span className="text-foreground font-medium">${avgSalary.toLocaleString()}</span></span>
        <span>avg score <span className="text-foreground font-medium">{avgScore}</span></span>
      </span>
    </div>
  )
}

export function GroupingTab() {
  const [grouping, setGrouping] = useState<GroupingState>(['department'])

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground">Group by:</span>
        {GROUP_OPTIONS.map((opt) => {
          const active = JSON.stringify(grouping) === JSON.stringify(opt.value)
          return (
            <button
              key={opt.label}
              onClick={() => setGrouping(opt.value)}
              className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                active
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              {opt.label}
            </button>
          )
        })}
        <button
          onClick={() => setGrouping([])}
          className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
            grouping.length === 0
              ? 'bg-primary text-primary-foreground border-primary'
              : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
          }`}
        >
          None
        </button>
      </div>
      <DataGrid
        data={ALL_DATA}
        columns={columns}
        enableGrouping
        grouping={grouping}
        onGroupingChange={setGrouping}
        renderGroupRow={(row) => <GroupRowLabel row={row as Row<Employee>} />}
        tableWidthMode="fill-last"
        rowHeight={36}
        maxTableHeight={520}
        minTableHeight={200}
      />
    </section>
  )
}

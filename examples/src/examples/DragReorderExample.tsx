import { useState } from 'react'
import { DataGridDrag, DragHandleCell } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'

// ── Types & Data ───────────────────────────────────────────────────────────────

interface Task {
  id: string
  priority: number
  title: string
  assignee: string
  status: 'Todo' | 'In Progress' | 'Done'
}

const INITIAL_DATA: Task[] = [
  { id: 't1', priority: 1, title: 'Design system setup',       assignee: 'Alice',  status: 'Done' },
  { id: 't2', priority: 2, title: 'API integration',           assignee: 'Bob',    status: 'In Progress' },
  { id: 't3', priority: 3, title: 'Write unit tests',          assignee: 'Carol',  status: 'Todo' },
  { id: 't4', priority: 4, title: 'Performance audit',         assignee: 'Dave',   status: 'Todo' },
  { id: 't5', priority: 5, title: 'Deploy to staging',         assignee: 'Alice',  status: 'In Progress' },
  { id: 't6', priority: 6, title: 'User acceptance testing',   assignee: 'Eve',    status: 'Todo' },
  { id: 't7', priority: 7, title: 'Documentation',             assignee: 'Bob',    status: 'Todo' },
  { id: 't8', priority: 8, title: 'Production release',        assignee: 'Carol',  status: 'Todo' },
]

// ── Columns ────────────────────────────────────────────────────────────────────

const columns: DataGridColumnDef<Task>[] = [
  {
    id: 'drag',
    size: 36,
    enableResizing: false,
    enableSorting: false,
    header: '',
    cell: () => <DragHandleCell />,
    meta: { filterType: false },
  },
  { accessorKey: 'priority', header: '#',        meta: { flex: 0.4, align: 'right' } },
  { accessorKey: 'title',    header: 'Task',     meta: { flex: 3 } },
  { accessorKey: 'assignee', header: 'Assignee', meta: { flex: 1 } },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: { flex: 1 },
    cell: ({ row }) => {
      const s = row.original.status
      const map: Record<string, { bg: string; color: string }> = {
        'Todo':        { bg: '#f1f5f9', color: '#64748b' },
        'In Progress': { bg: '#dbeafe', color: '#1e40af' },
        'Done':        { bg: '#dcfce7', color: '#166534' },
      }
      const { bg, color } = map[s]!
      return (
        <span style={{ display: 'inline-flex', padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 500, background: bg, color }}>
          {s}
        </span>
      )
    },
  },
]

// ── Example ────────────────────────────────────────────────────────────────────

export function DragReorderExample() {
  const [tasks, setTasks] = useState<Task[]>(INITIAL_DATA)

  return (
    <DataGridDrag
      data={tasks}
      columns={columns}
      getRowId={(row) => row.id}
      onRowReorder={setTasks}
      bordered
      emptyMessage="No tasks"
    />
  )
}

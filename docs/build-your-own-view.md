# Build Your Own View

GridKit separates the data pipeline from the rendered view. Use the public View SDK when the built-in table, card, list, chat, or agent-chat views get you 90% of the way there but the final layout needs to be yours.

## Public Contract

Use only these public pieces for custom views:

- `useGridKitView(options)` returns `{ table, rows, wrapperRef, containerRef, queryState }`.
- `GridKitShell` renders the shared toolbar, frame, scroll container, custom scrollbar, and footer slots.
- `useGridKitRovingFocus({ rows })` gives custom Card/List/Chat-like views a small focus-state helper when they need keyboard-aware rendering.
- `useInfiniteScroll` is intentionally still internal for now. Custom views can use their own intersection observer until the helper contract is finalized.

`useDataGridBase` and internal view prop types are not public API. They can change without a major version bump.

## Minimal View

```tsx
import { GridKitShell, useGridKitView, type DataGridColumnDef } from '@loykin/gridkit'
import type { Row } from '@tanstack/react-table'

interface Task {
  id: string
  title: string
  status: 'Todo' | 'In Progress' | 'Done'
}

const columns: DataGridColumnDef<Task>[] = [
  { accessorKey: 'title' },
  { accessorKey: 'status', meta: { filterType: 'select' } },
]

function KanbanBoard({ rows }: { rows: Row<Task>[] }) {
  const statuses = ['Todo', 'In Progress', 'Done'] as const

  return (
    <div className="kanban-board">
      {statuses.map((status) => (
        <section key={status} className="kanban-column">
          <h3>{status}</h3>
          {rows
            .filter((row) => row.original.status === status)
            .map((row) => (
              <article key={row.id}>{row.original.title}</article>
            ))}
        </section>
      ))}
    </div>
  )
}

export function TaskKanban({ data }: { data: Task[] }) {
  const view = useGridKitView({
    data,
    columns,
    enableColumnFilters: true,
    columnSizingMode: 'fixed',
  })

  return (
    <GridKitShell
      wrapperRef={view.wrapperRef}
      containerRef={view.containerRef}
      table={view.table}
      tableHeight={420}
      frameView="card"
    >
      <KanbanBoard rows={view.rows} />
    </GridKitShell>
  )
}
```

## Notes

- `rows` are TanStack rows after GridKit sorting, filtering, search, grouping, pagination, and backend query state have been applied.
- `table` is the live TanStack table instance. Use it for toolbar slots, column state, pagination, and filter controls.
- `wrapperRef` belongs on `GridKitShell`; `containerRef` is assigned to the inner scroll frame.
- Keep view state local to your custom view. GridKit owns data/query/table state; your view owns layout-only state.

## Custom Focus State

Card, list, and chat layouts do not use table-cell keyboard navigation. If your custom view still needs to know which item is focused, use `useGridKitRovingFocus` with the rows from `useGridKitView`.

```tsx
const view = useGridKitView({ data, columns })
const focus = useGridKitRovingFocus({
  rows: view.rows,
  orientation: 'grid',
  columnCount: 3,
})

return (
  <GridKitShell wrapperRef={view.wrapperRef} containerRef={view.containerRef} table={view.table}>
    {view.rows.map((row, index) => (
      <article
        key={row.id}
        {...focus.getItemProps(index)}
        data-selected={focus.focusedRow?.id === row.id ? 'true' : undefined}
      >
        {row.original.title}
      </article>
    ))}
  </GridKitShell>
)
```

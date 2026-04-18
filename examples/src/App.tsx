import { useState } from 'react'
import { BasicExample } from './examples/BasicExample'
import { PaginationExample } from './examples/PaginationExample'
import { FiltersExample } from './examples/FiltersExample'
import { ServerSideExample } from './examples/ServerSideExample'
import { InfiniteScrollExample } from './examples/InfiniteScrollExample'
import { DragReorderExample } from './examples/DragReorderExample'
import { RealtimeExample } from './examples/RealtimeExample'

const EXAMPLES = [
  { id: 'basic',          label: 'Basic',                component: BasicExample },
  { id: 'pagination',     label: 'Pagination',           component: PaginationExample },
  { id: 'filters',        label: 'Filters & Toolbar',    component: FiltersExample },
  { id: 'server-side',    label: 'Server-Side',          component: ServerSideExample },
  { id: 'infinite-scroll',label: 'Infinite Scroll',      component: InfiniteScrollExample },
  { id: 'drag-reorder',   label: 'Drag Reorder',         component: DragReorderExample },
  { id: 'realtime',       label: 'Real-Time DataStore',  component: RealtimeExample },
] as const

type ExampleId = (typeof EXAMPLES)[number]['id']

const DESCRIPTIONS: Record<ExampleId, string> = {
  'basic':           'Sorting, column resizing, row click, bordered mode.',
  'pagination':      'DataGridPaginationBar · DataGridPaginationPages · DataGridPaginationCompact — all placement patterns.',
  'filters':         'Column filter row, icon mode, GlobalSearch, SelectFilter, ColumnVisibilityDropdown.',
  'server-side':     'Manual sorting + filtering + pagination — all controlled externally with a fake async backend.',
  'infinite-scroll': 'DataGridInfinity with IntersectionObserver-based next-page loading.',
  'drag-reorder':    'DataGridDrag — drag-to-reorder rows via dnd-kit.',
  'realtime':        'DataStore + applyTransaction — high-frequency updates without full re-render.',
}

export function App() {
  const [active, setActive] = useState<ExampleId>('basic')
  const example = EXAMPLES.find((e) => e.id === active)!
  const Component = example.component

  return (
    <div className="layout">
      <nav className="sidebar">
        <span className="sidebar-title">gridkit examples</span>
        {EXAMPLES.map((e) => (
          <button
            key={e.id}
            className={`nav-item${active === e.id ? ' active' : ''}`}
            onClick={() => setActive(e.id)}
          >
            {e.label}
          </button>
        ))}
      </nav>

      <div className="content">
        <div className="content-header">
          <h1>{example.label}</h1>
          <p>{DESCRIPTIONS[active]}</p>
        </div>
        <div className="content-body">
          <Component />
        </div>
      </div>
    </div>
  )
}

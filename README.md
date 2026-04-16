# @loykin/gridkit

A feature-rich React DataGrid component built on TanStack Table with virtualization, sorting, filtering, pagination, and real-time updates.

**[Live Playground →](https://loykin.github.io/gridkit/playground/)** · **[GitHub →](https://github.com/loykin/gridkit)**

## Features

- **Virtualization** — renders only visible rows via `@tanstack/react-virtual` for large datasets
- **Sorting** — client-side and server-side (manual) sorting
- **Column Filters** — per-column filter row or icon-mode with `text`, `select`, `multi-select`, `number` types
- **Global Search** — searchable columns with a debounced toolbar search input
- **Pagination** — built-in pagination bar with configurable page sizes
- **Infinite Scroll** — `DataGridInfinity` with IntersectionObserver-based next-page loading
- **Row Drag Reorder** — `DataGridDrag` for sortable rows via dnd-kit
- **Column Resizing** — drag-to-resize with `'onChange'` or `'onEnd'` policy
- **Column Pinning** — pin columns left or right
- **Column Visibility** — show/hide columns via toolbar dropdown
- **Row Selection** — checkbox selection with select-all support
- **Row Actions** — per-row action menu (`⋯` button) defined at column level
- **Row Expansion** — tree rows with collapsible sub-rows
- **DataStore** — map-based external store for real-time / high-frequency updates
- **Column Sizing Persistence** — expose sizing via `onColumnSizingChange` and restore via `columnSizing`
- **Server-Side Support** — sorting, pagination, filtering all controllable externally
- **Escape Hatch** — `tableOptions` prop passes advanced TanStack Table options safely
- **Custom Scrollbars** — consistent cross-platform scrollbars

---

## Installation

```bash
npm install @loykin/gridkit
```

### Peer Dependencies

```bash
npm install react react-dom @tanstack/react-table @tanstack/react-virtual
```

---

## CSS Setup

Import the stylesheet once in your app entry point:

```ts
import '@loykin/gridkit/styles'
```

### Theming with CSS Variables

**With shadcn/ui** — works out of the box. The `--dg-*` variables automatically fall back to your existing shadcn CSS variables.

**Standalone** — hardcoded defaults are applied automatically.

**Custom theme** — override only what you need:

```css
:root {
  --dg-background: #ffffff;
  --dg-foreground: #0a0a0a;
  --dg-border: #e5e7eb;
  --dg-primary: #3b82f6;
  --dg-muted: #f5f5f5;
  --dg-muted-foreground: #6b7280;
  --dg-radius: 0.5rem;
}

.dark {
  --dg-background: #0a0a0a;
  --dg-foreground: #fafafa;
  --dg-border: rgba(255, 255, 255, 0.1);
  --dg-primary: #6366f1;
  --dg-muted: #1a1a1a;
  --dg-muted-foreground: #a1a1aa;
}
```

#### All `--dg-*` Variables

| Variable | Description |
|---|---|
| `--dg-background` | Table / cell background |
| `--dg-foreground` | Default text color |
| `--dg-popover` | Dropdown / popover background |
| `--dg-popover-foreground` | Dropdown text color |
| `--dg-primary` | Primary accent (checkboxes, active filters) |
| `--dg-primary-foreground` | Text on primary backgrounds |
| `--dg-secondary` | Secondary background |
| `--dg-secondary-foreground` | Secondary text |
| `--dg-muted` | Header / muted background |
| `--dg-muted-foreground` | Muted text (placeholders, hints) |
| `--dg-accent` | Hover / accent background |
| `--dg-accent-foreground` | Accent text |
| `--dg-destructive` | Destructive action color |
| `--dg-border` | Border color |
| `--dg-input` | Input border color |
| `--dg-ring` | Focus ring color |
| `--dg-radius` | Border radius base value |

---

## Basic Usage

### DataGrid (with Pagination)

```tsx
import { DataGrid } from '@loykin/gridkit'
import '@loykin/gridkit/styles'

const columns = [
  { accessorKey: 'id',    header: 'ID'    },
  { accessorKey: 'name',  header: 'Name'  },
  { accessorKey: 'email', header: 'Email' },
]

export function MyTable() {
  return (
    <DataGrid
      data={rows}
      columns={columns}
      enablePagination
      tableHeight={400}
    />
  )
}
```

### DataGridInfinity (Infinite Scroll)

```tsx
import { DataGridInfinity } from '@loykin/gridkit'

export function MyInfiniteTable() {
  const { data, hasNextPage, isFetchingNextPage, fetchNextPage } = useInfiniteQuery(...)

  return (
    <DataGridInfinity
      data={data}
      columns={columns}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      tableHeight={500}
    />
  )
}
```

### DataGridDrag (Row Reorder)

```tsx
import { DataGridDrag, DragHandleCell } from '@loykin/gridkit'

const columns = [
  {
    id: 'drag',
    size: 36,
    enableResizing: false,
    cell: () => <DragHandleCell />,
  },
  { accessorKey: 'name', header: 'Name' },
  // ...
]

export function MyDraggableTable() {
  const [rows, setRows] = useState(data)

  return (
    <DataGridDrag
      data={rows}
      columns={columns}
      getRowId={(row) => row.id}
      onRowReorder={setRows}
    />
  )
}
```

> Place `DragHandleCell` in the `cell` of whichever column should act as the grab handle. Only works inside `DataGridDrag`.

---

## Column Definition

Columns follow `@tanstack/react-table`'s `ColumnDef` with additional `meta` options:

```tsx
import type { DataGridColumnDef } from '@loykin/gridkit'

const columns: DataGridColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 200,
    meta: {
      flex: 1,              // stretch to fill remaining width proportionally
      minWidth: 100,
      align: 'left',        // 'left' | 'center' | 'right'
      pin: 'left',          // 'left' | 'right'
      wrap: true,           // allow multi-line cell content
      filterType: 'text',   // 'text' | 'select' | 'multi-select' | 'number' | false
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    meta: {
      filterType: 'select', // dropdown of unique values (lazy-loaded on first open)
    },
  },
  {
    accessorKey: 'score',
    header: 'Score',
    meta: {
      filterType: 'number', // min / max range filter
    },
  },
  {
    id: 'actions',
    header: '',
    meta: {
      actions: (row) => [
        { label: 'Edit',   onClick: (row) => openEdit(row) },
        { label: 'Delete', onClick: (row) => deleteRow(row), variant: 'destructive' },
      ],
    },
  },
]
```

---

## Props

### Shared Props (`DataGrid`, `DataGridInfinity`, `DataGridDrag`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `T[]` | `[]` | Row data |
| `dataStore` | `DataStore<T>` | — | Map-based external store for real-time updates. Mutually exclusive with `data` |
| `columns` | `DataGridColumnDef<T>[]` | — | Column definitions |
| `error` | `Error \| null` | — | Display error state |
| `isLoading` | `boolean` | — | Show loading skeleton |
| `emptyMessage` | `string` | `'No data'` | Message when data is empty |
| `emptyContent` | `ReactNode` | — | Custom empty state UI (overrides `emptyMessage`) |
| `showHeader` | `boolean` | `true` | Show/hide the header row |
| `tableHeight` | `string \| number \| 'auto'` | `'auto'` | Fixed height — enables internal scroll and virtualization |
| `rowHeight` | `number` | `33` | Row height in px (also sets virtualizer estimate) |
| `estimateRowHeight` | `number` | — | Override virtualizer estimate independently of `rowHeight` |
| `overscan` | `number` | `10` | Rows to render outside the visible area |
| `bordered` | `boolean` | `false` | Show vertical dividers between columns |
| `tableWidthMode` | `'spacer' \| 'fill-last' \| 'independent'` | `'spacer'` | How remaining horizontal space is distributed |
| `onRowClick` | `(row: T) => void` | — | Row click handler |
| `rowCursor` | `boolean` | `false` | Show pointer cursor on rows without `onRowClick` |
| `classNames` | `DataGridClassNames` | — | Slot-based class injection for table elements |
| **Sorting** | | | |
| `enableSorting` | `boolean` | `true` | Enable column sorting |
| `initialSorting` | `SortingState` | — | Initial sort state |
| `onSortingChange` | `(s: SortingState) => void` | — | Called on sort change |
| `manualSorting` | `boolean` | `false` | Disable client-side sort — handle externally |
| **Filtering** | | | |
| `enableColumnFilters` | `boolean` | `false` | Show per-column filter UI |
| `filterDisplay` | `'row' \| 'icon'` | `'row'` | Filter as a dedicated row or icon inside header cell |
| `manualFiltering` | `boolean` | `false` | Disable client-side filtering — handle externally |
| `columnFilters` | `ColumnFiltersState` | — | Controlled column filter state |
| `onColumnFiltersChange` | `(f: ColumnFiltersState) => void` | — | Called on filter change |
| `globalFilter` | `string` | — | Controlled global search value |
| `onGlobalFilterChange` | `(v: string) => void` | — | Called on global search change |
| `searchableColumns` | `string[]` | — | Column keys included in global search |
| `leftFilters` | `(table) => ReactNode` | — | Custom toolbar UI on the left |
| `rightFilters` | `(table) => ReactNode` | — | Custom toolbar UI on the right |
| **Column Sizing** | | | |
| `enableColumnResizing` | `boolean` | `true` | Enable drag-to-resize columns |
| `columnResizeMode` | `'onChange' \| 'onEnd'` | `'onChange'` | When resize updates are applied |
| `columnSizingMode` | `'auto' \| 'flex' \| 'fixed'` | `'flex'` | Column width strategy |
| `columnSizing` | `ColumnSizingState` | — | Initial column widths — restore from localStorage, URL, backend, etc. |
| `onColumnSizingChange` | `(s: ColumnSizingState) => void` | — | Called on column resize |
| **Visibility & Pinning** | | | |
| `visibilityState` | `VisibilityState` | — | Controlled column visibility |
| `initialPinning` | `ColumnPinningState` | — | Initial pinned columns `{ left: [...], right: [...] }` |
| **Row Expansion** | | | |
| `enableExpanding` | `boolean` | `false` | Enable collapsible sub-rows |
| `getSubRows` | `(row: T, index: number) => T[] \| undefined` | — | Extract sub-rows from a row item |
| **Selection** | | | |
| `checkboxConfig` | `CheckboxConfig<T>` | — | Row checkbox selection configuration |
| **State Persistence** | | | |
| `tableKey` | `string` | — | Key for in-memory Zustand state persistence |
| `syncState` | `boolean` | `false` | Sync pagination and search to Zustand store (requires `tableKey`) |
| **Callbacks** | | | |
| `onTableReady` | `(table: Table<T>) => void` | — | Called when TanStack Table instance is ready |
| **Advanced** | | | |
| `tableOptions` | `PassthroughTableOptions<T>` | — | Escape hatch for advanced TanStack Table options (see below) |

### `DataGrid`-only Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `enablePagination` | `boolean` | `true` | Show pagination bar |
| `paginationConfig` | `{ pageSize?: number; initialPageIndex?: number }` | — | Pagination defaults |
| `pageSizes` | `number[]` | — | Available page size options |
| `totalCount` | `number` | — | Server-side total row count (enables manual pagination) |
| `onPageChange` | `(pageIndex: number, pageSize: number) => void` | — | Called on page change |

### `DataGridInfinity`-only Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `hasNextPage` | `boolean` | — | Whether more pages exist |
| `isFetchingNextPage` | `boolean` | — | Show loading indicator at bottom |
| `fetchNextPage` | `() => void` | — | Called to load next page |
| `rootMargin` | `string` | — | IntersectionObserver `rootMargin` to trigger early loading |

### `DataGridDrag`-only Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `getRowId` | `(row: T, index: number) => string` | — | **Required.** Stable unique id per row |
| `onRowReorder` | `(newData: T[]) => void` | — | Called with the full reordered data array after each drag |

---

## Column `meta` Reference

| Field | Type | Description |
|---|---|---|
| `flex` | `number` | Flex ratio — distributes remaining container width proportionally |
| `autoSize` | `boolean` | Auto-fit column width to content via canvas text measurement |
| `minWidth` | `number` | Minimum column width in px |
| `maxWidth` | `number` | Maximum column width in px |
| `align` | `'left' \| 'center' \| 'right'` | Cell text alignment |
| `pin` | `'left' \| 'right'` | Pin column at definition level |
| `wrap` | `boolean` | Allow multi-line content; row height adjusts automatically |
| `filterType` | `'text' \| 'select' \| 'multi-select' \| 'number' \| false` | Filter input type for this column |
| `actions` | `(row: T) => Action[]` | Row action menu items |

---

## Toolbar Components

Import standalone toolbar components to compose your own toolbar:

```tsx
import {
  GlobalSearch,
  SelectFilter,
  MultiSelectFilter,
  ColumnVisibilityDropdown,
} from '@loykin/gridkit'

function Toolbar({ table }) {
  return (
    <div className="flex items-center gap-2">
      <GlobalSearch table={table} placeholder="Search…" />
      <SelectFilter table={table} columnId="status" label="Status" />
      <MultiSelectFilter table={table} columnId="role" label="Role" />
      <ColumnVisibilityDropdown table={table} />
    </div>
  )
}

// Pass as leftFilters / rightFilters
<DataGrid
  leftFilters={(table) => <Toolbar table={table} />}
  ...
/>
```

---

## Server-Side Filtering

```tsx
import { DataGrid } from '@loykin/gridkit'
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table'

export function ServerFilteredGrid() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [page, setPage] = useState({ index: 0, size: 20 })

  const { data, total, isLoading } = useQuery({
    queryKey: ['items', sorting, columnFilters, page],
    queryFn: () => fetchItems({ sorting, columnFilters, ...page }),
  })

  return (
    <DataGrid
      data={data?.items ?? []}
      columns={columns}
      isLoading={isLoading}
      totalCount={total}
      enablePagination
      manualSorting
      onSortingChange={setSorting}
      manualFiltering
      enableColumnFilters
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
      onPageChange={(index, size) => setPage({ index, size })}
      tableHeight={500}
    />
  )
}
```

---

## Column Sizing Persistence

The library is storage-agnostic — use `columnSizing` + `onColumnSizingChange` to connect any storage layer:

```tsx
// localStorage (with a hook like use-local-storage-state)
const [sizing, setSizing] = useLocalStorageState('my-table-sizing', { defaultValue: {} })

<DataGrid
  columnSizing={sizing}
  onColumnSizingChange={setSizing}
  ...
/>

// URL query params
<DataGrid
  columnSizing={parseSizingFromURL(searchParams)}
  onColumnSizingChange={(s) => setSearchParams(encodeSizing(s))}
  ...
/>

// Backend / user preferences
<DataGrid
  columnSizing={userPrefs?.columnSizing}
  onColumnSizingChange={(s) => savePrefs({ columnSizing: s })}
  ...
/>
```

---

## Row Expansion (Tree)

```tsx
import { TreeCell } from '@loykin/gridkit'

const columns = [
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row, getValue }) => (
      <TreeCell row={row}>{getValue<string>()}</TreeCell>
    ),
  },
  // ...
]

<DataGrid
  data={treeData}
  columns={columns}
  enableExpanding
  getSubRows={(row) => row.children}
/>
```

---

## DataStore (Real-Time Updates)

For high-frequency updates (WebSocket, polling), use `DataStore` to avoid re-rendering the full dataset:

```tsx
import { createDataStore, useDataStore, DataGrid } from '@loykin/gridkit'

const store = createDataStore<Order>((order) => order.id)

export function LiveOrdersTable() {
  const dataStore = useDataStore(store)

  useEffect(() => {
    ws.on('order', (order) => {
      store.applyTransaction({ update: [{ id: order.id, data: order }] })
    })
  }, [])

  return <DataGrid dataStore={dataStore} columns={columns} tableHeight={500} />
}
```

---

## Escape Hatch (`tableOptions`)

For advanced TanStack Table options not exposed as individual props:

```tsx
<DataGrid
  tableOptions={{
    meta: { myData: 'value' },
    autoResetPageIndex: false,
    autoResetColumnFilters: false,
    defaultColumn: { size: 150 },
  }}
  ...
/>
```

Excluded from `tableOptions` (managed internally): `data`, `columns`, `state`, `getRowId`, all `on*Change` handlers, all row model getters, `manualSorting`, `manualPagination`, `manualFiltering`.

---

## `CheckboxConfig<T>`

```ts
interface CheckboxConfig<T> {
  getRowId: (row: T) => string
  selectedIds: Set<string>
  onSelectAll: (rows: Row<T>[], checked: boolean) => void
  onSelectOne: (rowId: string, checked: boolean) => void
}
```

---

## `DataGridClassNames`

```ts
interface DataGridClassNames {
  container?: string  // outermost wrapper (border, rounded-md)
  header?: string     // header panel (bg-muted)
  headerCell?: string // individual header cell
  row?: string        // body row
  cell?: string       // body cell
}
```

---

## License

MIT

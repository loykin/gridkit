# @loykin/gridkit

A feature-rich React DataGrid built on TanStack Table — Tailwind-independent, fully themeable via CSS variables, with virtualization, sorting, filtering, pagination, and real-time updates.

**[Live Playground →](https://loykin.github.io/gridkit/playground/)** · **[GitHub →](https://github.com/loykin/gridkit)**

---

## Features

- **No Tailwind required** — all styles ship as `dg-*` CSS classes. Works in any stack.
- **Virtualization** — only visible rows are rendered via `@tanstack/react-virtual`
- **Sorting** — client-side and server-side (manual)
- **Column Filters** — filter row or icon-mode with `text`, `select`, `multi-select`, `number` types
- **Global Search** — debounced toolbar search across configurable columns
- **Pagination** — flexible placement: `footer`, toolbar, or fully external via `onTableReady`
- **Infinite Scroll** — `DataGridInfinity` with IntersectionObserver-based next-page loading
- **Row Drag Reorder** — `DataGridDrag` for sortable rows via dnd-kit
- **Column Resizing** — drag-to-resize with `onChange` or `onEnd` policy
- **Column Pinning** — pin columns left or right
- **Column Visibility** — show/hide columns via toolbar dropdown
- **Row Selection** — checkbox selection with select-all support
- **Row Actions** — per-row action menu defined at column level
- **Row Expansion** — tree rows with collapsible sub-rows
- **DataStore** — map-based external store for high-frequency real-time updates
- **Server-Side Support** — sorting, filtering, and pagination all controllable externally
- **CSS Theming** — override `--dg-*` variables to match any design system
- **Icon Overrides** — replace any built-in icon via the `icons` prop
- **Escape Hatch** — `tableOptions` passes advanced TanStack Table options safely

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

**Standalone** — hardcoded defaults are applied automatically. No configuration needed.

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
| `--dg-primary` | Primary accent (active page button, checkboxes) |
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
      tableHeight={400}
    />
  )
}
```

---

## Pagination

Pagination is opt-in. The `pagination` prop activates TanStack Table's pagination logic; the UI is injected separately so you can place it anywhere.

### Pagination Components

| Component | Description | Best placement |
|---|---|---|
| `DataGridPaginationBar` | Full bar: rows-per-page dropdown + page info + nav buttons | `footer` |
| `DataGridPaginationCompact` | Minimal: `< X / Y >` nav only | `rightFilters` (toolbar) |
| `DataGridPaginationPages` | Numbered pages: `<< < 1 2 [3] … 20 > >>` | `footer` |

### Placement Options

**footer — below the grid**

```tsx
import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'

<DataGrid
  data={rows}
  columns={columns}
  pagination={{ pageSize: 20 }}
  footer={(table) => (
    <DataGridPaginationBar table={table} pageSizes={[10, 20, 50]} />
  )}
/>
```

**toolbar — inside the filter row**

```tsx
import { DataGrid, DataGridPaginationCompact } from '@loykin/gridkit'

<DataGrid
  data={rows}
  columns={columns}
  pagination={{ pageSize: 20 }}
  rightFilters={(table) => <DataGridPaginationCompact table={table} />}
/>
```

**numbered pages**

```tsx
import { DataGrid, DataGridPaginationPages } from '@loykin/gridkit'

<DataGrid
  data={rows}
  columns={columns}
  pagination={{ pageSize: 10 }}
  footer={(table) => <DataGridPaginationPages table={table} siblingCount={2} />}
/>
```

**external — outside the DataGrid**

```tsx
import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'

const [table, setTable] = useState(null)

// Render anywhere — above, below, in a sidebar, etc.
{table && <DataGridPaginationBar table={table} />}

<DataGrid
  data={rows}
  columns={columns}
  pagination={{ pageSize: 20 }}
  onTableReady={(t) => setTable(t)}
/>
```

### Server-Side Pagination

```tsx
<DataGrid
  data={pageRows}           // current page data only
  columns={columns}
  pagination={{
    pageSize: 20,
    pageCount: Math.ceil(totalCount / 20),   // tells TanStack total pages
    onPageChange: (pageIndex, pageSize) => {  // fetch on every page change
      fetchPage(pageIndex, pageSize)
    },
  }}
  footer={(table) => (
    <DataGridPaginationBar table={table} totalCount={totalCount} />
  )}
/>
```

### `DataGridPaginationConfig`

| Field | Type | Default | Description |
|---|---|---|---|
| `pageSize` | `number` | `20` | Initial page size |
| `initialPageIndex` | `number` | `0` | Initial page index (0-based) |
| `pageCount` | `number` | — | Total page count for server-side (manual) pagination |
| `onPageChange` | `(pageIndex, pageSize) => void` | — | Called on every page or size change |

---

## DataGridInfinity (Infinite Scroll)

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

---

## DataGridDrag (Row Reorder)

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

> Place `DragHandleCell` in the `cell` of whichever column should act as the grab handle.

---

## Column Definition

Columns follow `@tanstack/react-table`'s `ColumnDef` with additional `meta` options:

```tsx
import type { DataGridColumnDef } from '@loykin/gridkit'

const columns: DataGridColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    meta: {
      flex: 1,              // stretch proportionally to fill remaining width
      minWidth: 100,
      align: 'left',        // 'left' | 'center' | 'right'
      pin: 'left',          // 'left' | 'right'
      wrap: true,           // allow multi-line cell content
      filterType: 'text',   // 'text' | 'select' | 'multi-select' | 'number' | false
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

### Column `meta` Reference

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

## Props

### Shared Props (`DataGrid`, `DataGridInfinity`, `DataGridDrag`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `T[]` | `[]` | Row data |
| `dataStore` | `DataStore<T>` | — | Map-based store for real-time updates. Mutually exclusive with `data` |
| `columns` | `DataGridColumnDef<T>[]` | — | Column definitions |
| `error` | `Error \| null` | — | Display error state |
| `isLoading` | `boolean` | — | Show loading skeleton |
| `emptyMessage` | `string` | — | Message when data is empty |
| `emptyContent` | `ReactNode` | — | Custom empty state UI (overrides `emptyMessage`) |
| `showHeader` | `boolean` | `true` | Show/hide the header row |
| `tableHeight` | `string \| number \| 'auto'` | `'auto'` | Fixed height — enables internal scroll and virtualization |
| `rowHeight` | `number` | `33` | Row height in px (also sets virtualizer estimate) |
| `estimateRowHeight` | `number` | — | Override virtualizer estimate independently of `rowHeight` |
| `overscan` | `number` | `10` | Rows to render outside the visible area |
| `bordered` | `boolean` | `false` | Show vertical dividers between columns |
| `tableWidthMode` | `'spacer' \| 'fill-last' \| 'independent'` | `'spacer'` | How remaining horizontal space is distributed |
| `onRowClick` | `(row: T) => void` | — | Row click handler |
| `rowCursor` | `boolean` | `false` | Show pointer cursor on rows |
| `classNames` | `DataGridClassNames` | — | Slot-based class injection for table elements |
| `icons` | `DataGridIcons` | — | Override any built-in icon slot |
| **Sorting** ||||
| `enableSorting` | `boolean` | `true` | Enable column sorting |
| `initialSorting` | `SortingState` | — | Initial sort state |
| `onSortingChange` | `(s: SortingState) => void` | — | Called on sort change |
| `manualSorting` | `boolean` | `false` | Disable client-side sort — handle externally |
| **Filtering** ||||
| `enableColumnFilters` | `boolean` | `false` | Show per-column filter UI |
| `filterDisplay` | `'row' \| 'icon'` | `'row'` | Filter as dedicated row or icon inside header cell |
| `manualFiltering` | `boolean` | `false` | Disable client-side filtering — handle externally |
| `columnFilters` | `ColumnFiltersState` | — | Controlled column filter state |
| `onColumnFiltersChange` | `(f: ColumnFiltersState) => void` | — | Called on filter change |
| `globalFilter` | `string` | — | Controlled global search value |
| `onGlobalFilterChange` | `(v: string) => void` | — | Called on global search change |
| `searchableColumns` | `string[]` | — | Column keys included in global search |
| `leftFilters` | `(table: Table<T>) => ReactNode` | — | Custom toolbar UI on the left |
| `rightFilters` | `(table: Table<T>) => ReactNode` | — | Custom toolbar UI on the right |
| **Column Sizing** ||||
| `enableColumnResizing` | `boolean` | `true` | Enable drag-to-resize columns |
| `columnResizeMode` | `'onChange' \| 'onEnd'` | `'onChange'` | When resize updates are applied |
| `columnSizingMode` | `'auto' \| 'flex' \| 'fixed'` | `'flex'` | Column width strategy |
| `columnSizing` | `ColumnSizingState` | — | Initial column widths |
| `onColumnSizingChange` | `(s: ColumnSizingState) => void` | — | Called on column resize |
| **Visibility & Pinning** ||||
| `visibilityState` | `VisibilityState` | — | Controlled column visibility |
| `initialPinning` | `ColumnPinningState` | — | Initial pinned columns `{ left: [...], right: [...] }` |
| **Row Expansion** ||||
| `enableExpanding` | `boolean` | `false` | Enable collapsible sub-rows |
| `getSubRows` | `(row: T, index: number) => T[] \| undefined` | — | Extract sub-rows from a row item |
| **Selection** ||||
| `checkboxConfig` | `CheckboxConfig<T>` | — | Row checkbox selection configuration |
| **State Persistence** ||||
| `tableKey` | `string` | — | Key for in-memory Zustand state persistence |
| `syncState` | `boolean` | `false` | Sync pagination and search state (requires `tableKey`) |
| **Callbacks** ||||
| `onTableReady` | `(table: Table<T>) => void` | — | Called when TanStack Table instance is ready |
| `onColumnSizingChange` | `(s: ColumnSizingState) => void` | — | Called on column resize |
| **Advanced** ||||
| `tableOptions` | `PassthroughTableOptions<T>` | — | Escape hatch for advanced TanStack Table options |

### `DataGrid`-only Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `pagination` | `DataGridPaginationConfig` | — | Enables TanStack pagination. Omit to disable |
| `footer` | `(table: Table<T>) => ReactNode` | — | Render slot below the grid (pagination bar, totals row, etc.) |
| `tableRef` | `RefObject<Table<T> \| null>` | — | Ref populated with the TanStack Table instance |

### `DataGridInfinity`-only Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `hasNextPage` | `boolean` | — | Whether more pages exist |
| `isFetchingNextPage` | `boolean` | — | Show loading indicator at bottom |
| `fetchNextPage` | `() => void` | — | Called to load the next page |
| `rootMargin` | `string` | `'100px'` | IntersectionObserver `rootMargin` for early trigger |

### `DataGridDrag`-only Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `getRowId` | `(row: T, index: number) => string` | — | **Required.** Stable unique id per row |
| `onRowReorder` | `(newData: T[]) => void` | — | Called with the full reordered data array after each drag |

---

## Toolbar Components

```tsx
import {
  GlobalSearch,
  SelectFilter,
  MultiSelectFilter,
  ColumnVisibilityDropdown,
} from '@loykin/gridkit'

<DataGrid
  leftFilters={(table) => (
    <>
      <GlobalSearch table={table} placeholder="Search…" />
      <SelectFilter table={table} columnId="status" label="Status" />
      <MultiSelectFilter table={table} columnId="department" label="Dept" />
    </>
  )}
  rightFilters={(table) => <ColumnVisibilityDropdown table={table} />}
  ...
/>
```

---

## Server-Side Sorting & Filtering

```tsx
import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'
import type { ColumnFiltersState, SortingState } from '@tanstack/react-table'

export function ServerGrid() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [pageRows, setPageRows] = useState([])
  const [totalCount, setTotalCount] = useState(0)

  const PAGE_SIZE = 20

  async function load(pageIndex: number, pageSize: number) {
    const { rows, total } = await fetchItems({ sorting, columnFilters, pageIndex, pageSize })
    setPageRows(rows)
    setTotalCount(total)
  }

  return (
    <DataGrid
      data={pageRows}
      columns={columns}
      isLoading={isLoading}
      manualSorting
      onSortingChange={setSorting}
      manualFiltering
      enableColumnFilters
      columnFilters={columnFilters}
      onColumnFiltersChange={setColumnFilters}
      pagination={{
        pageSize: PAGE_SIZE,
        pageCount: Math.ceil(totalCount / PAGE_SIZE),
        onPageChange: (pageIndex, pageSize) => load(pageIndex, pageSize),
      }}
      footer={(table) => (
        <DataGridPaginationBar table={table} totalCount={totalCount} />
      )}
      tableHeight={500}
    />
  )
}
```

---

## Column Sizing Persistence

```tsx
// localStorage
const [sizing, setSizing] = useLocalStorageState('my-table-sizing', { defaultValue: {} })

<DataGrid
  columnSizing={sizing}
  onColumnSizingChange={setSizing}
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

For high-frequency updates (WebSocket, polling) — only changed rows are re-evaluated:

```tsx
import { useDataStore, DataGrid } from '@loykin/gridkit'

export function LiveTable() {
  const store = useDataStore<Order>({ getRowId: (o) => o.id })

  useEffect(() => {
    ws.on('order', (order) => {
      store.applyTransaction({ update: [{ id: order.id, data: order }] })
    })
  }, [])

  return <DataGrid dataStore={store} columns={columns} tableHeight={500} />
}
```

---

## Icon Overrides

Replace any built-in icon slot. All icons accept any React node.

```tsx
import { ChevronUp, ChevronDown, Filter } from 'lucide-react'

<DataGrid
  icons={{
    sortAsc:  <ChevronUp size={12} />,
    sortDesc: <ChevronDown size={12} />,
    filter:   <Filter size={13} />,
  }}
  ...
/>
```

| Slot | Default icon | Used in |
|---|---|---|
| `sortAsc` | ArrowUp | Sorted ascending header |
| `sortDesc` | ArrowDown | Sorted descending header |
| `sortNone` | ArrowUpDown | Sortable but unsorted header |
| `filter` | Filter | Header filter icon button |
| `filterRange` | SlidersHorizontal | Number range filter button |
| `clearFilter` | X | Clear filter / search button |
| `rowActions` | MoreHorizontal | Row actions trigger (⋯) |
| `columnVisibility` | Columns3 | Column visibility dropdown button |
| `loading` | Loader2 | Loading spinner |
| `pageFirst` | ChevronsLeft | Go to first page |
| `pagePrev` | ChevronLeft | Go to previous page |
| `pageNext` | ChevronRight | Go to next page |
| `pageLast` | ChevronsRight | Go to last page |
| `search` | Search | Global search input prefix |
| `treeExpand` | ChevronRight | Tree row expand |
| `treeCollapse` | ChevronDown | Tree row collapse |
| `dragHandle` | GripVertical | Row drag handle |

---

## Escape Hatch (`tableOptions`)

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
  container?: string  // scroll container
  header?: string     // header panel
  headerCell?: string // individual header cell
  row?: string        // body row
  cell?: string       // body cell
}
```

---

## License

MIT

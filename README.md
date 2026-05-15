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
- **Card View** — `DataGridCard` renders rows as a responsive card grid — same filtering, sorting, and infinite scroll as the table view
- **List View** — `DataGridList` renders each row with a custom item renderer while keeping sorting, filtering, search, DataStore, and infinite loading
- **Chat View** — `DataGridChat` renders threaded/timeline-style messages with top loading, scroll offset preservation, and stick-to-bottom behavior
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

## Performance

Keep `data` and `columns` references stable when the values are derived during render. TanStack Table recalculates row models when these references change, and sorting/filtering operate over the full row set even when the DOM is virtualized.

```tsx
const columns = useMemo<DataGridColumnDef<User>[]>(
  () => [
    { accessorKey: 'name' },
    { accessorKey: 'status', meta: { filterType: 'select' } },
  ],
  [],
)

const data = useMemo(() => rowsFromQuery ?? [], [rowsFromQuery])
```

For large table views, set a fixed `tableHeight` so virtualization can keep DOM work bounded to the visible rows plus overscan. `DataGridList` also supports opt-in virtualization with `enableVirtualization` and a fixed `containerHeight`. `DataGridChat` is currently non-virtualized because prepend anchoring and bottom stickiness need stricter scroll handling.

### Current Limits

- `DataGridCard` is not virtualized. Use it for small/medium card collections, or add app-level paging/infinite loading for large data sets.
- Inline editing is basic cell editing: double-click enters `meta.editCell`, and the editor must call `onCommit` or `onCancel`. Validation, row edit mode, async save states, and undo/redo are not built in.
- Accessibility is partial. Table roles, `aria-sort`, and popover semantics are present, but full keyboard grid navigation and screen-reader workflow testing are not complete.
- Performance guidance is threshold-based rather than benchmark-based. Table virtualization turns on for fixed-height tables at 100+ rows; real app performance still depends on cell render cost, filter/sort cost, and data stability.

### Test Coverage

Unit/integration tests cover sorting, header groups, date/datetime filters, chat scroll behavior, list virtualization, reverse infinite scroll, stick-to-bottom, and state persistence.

Browser E2E coverage is intentionally focused on regressions that jsdom cannot catch:

```bash
pnpm test:e2e
```

The E2E suite starts the playground and verifies column resize vs reorder separation, header group alignment, datetime filter popover clipping, state persistence after reload, column visibility, runtime pinning, row actions, row selection, inline editing, tree expansion, and master-detail expansion.

---

## Pagination

Pagination is opt-in. The `pagination` prop activates TanStack Table's pagination logic; the UI is injected separately so you can place it anywhere.

### Pagination Components

| Component | Description | Best placement |
|---|---|---|
| `DataGridPaginationBar` | Full bar: rows-per-page dropdown + page info + nav buttons | `footer` |
| `DataGridPaginationCompact` | Minimal: `< X / Y >` nav only | `headerRight` (toolbar) |
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
  headerRight={(table) => <DataGridPaginationCompact table={table} />}
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

## DataGridList (Custom Row/List View)

Renders rows with your own item component instead of table markup. Columns still define the row schema for sorting, filtering, and global search; they do not have to be visible.

```tsx
import { DataGridList, GlobalSearch, SelectFilter } from '@loykin/gridkit'

const columns = [
  { accessorKey: 'name' },
  { accessorKey: 'department', meta: { filterType: 'select' } },
  { accessorKey: 'status', meta: { filterType: 'select' } },
]

export function EmployeeList() {
  return (
    <DataGridList
      data={employees}
      columns={columns}
      containerHeight={560}
      itemGap={8}
      itemPadding={12}
      headerLeft={(table) => (
        <SelectFilter table={table} columnId="department" label="Department" />
      )}
      headerRight={(table) => <GlobalSearch table={table} placeholder="Search…" />}
      renderItem={(row) => (
        <div className="rounded border p-3">
          <strong>{row.original.name}</strong>
          <span>{row.original.status}</span>
        </div>
      )}
    />
  )
}
```

### With infinite scroll

```tsx
<DataGridList
  data={data}
  columns={columns}
  renderItem={(row) => <InboxRow item={row.original} />}
  containerHeight={600}
  enableVirtualization
  estimateRowHeight={56}
  hasNextPage={hasNextPage}
  isFetchingNextPage={isFetchingNextPage}
  fetchNextPage={fetchNextPage}
/>
```

### `DataGridList`-only Props

List views use the shared row/data/filtering props, but omit table-only options such as column resizing, pinning, headers, and table width modes.

| Prop | Type | Default | Description |
|---|---|---|---|
| `renderItem` | `(row: Row<T>) => ReactNode` | — | **Required.** Render function for each list item |
| `itemKey` | `(row: Row<T>) => string` | `row.id` | Override the React key for each item |
| `itemGap` | `number` | `0` | Gap in px between list items |
| `itemPadding` | `number` | `0` | Padding in px around the list body |
| `containerHeight` | `string \| number \| 'auto'` | `'auto'` | Preferred list container height |
| `tableHeight` | `string \| number \| 'auto'` | `'auto'` | Compatibility alias for `containerHeight` |
| `enableVirtualization` | `boolean` | `false` | Render only the visible item window. Requires a fixed `containerHeight` or `tableHeight` |
| `estimateRowHeight` | `number` | `48` | Estimated item height in px for virtualization |
| `overscan` | `number` | `10` | Items rendered outside the visible window when virtualized |
| `headerLeft` | `ReactNode \| (table: Table<T>) => ReactNode` | — | Toolbar content on the left. Function form receives the table instance |
| `headerRight` | `ReactNode \| (table: Table<T>) => ReactNode` | — | Toolbar content on the right. Function form receives the table instance |
| `footer` | `ReactNode` | — | Static content below the list |
| `hasNextPage` | `boolean` | — | Whether more pages exist |
| `isFetchingNextPage` | `boolean` | — | Show loading indicator at the bottom |
| `fetchNextPage` | `() => void` | — | Called when the sentinel enters the viewport |
| `rootMargin` | `string` | `'100px'` | IntersectionObserver `rootMargin` for early trigger |
| `classNames` | `DataGridListClassNames` | — | Slot-based class injection for list elements |

### List CSS variables

| Variable | Default | Description |
|---|---|---|
| `--dg-list-gap` | `0px` | Gap between list items |
| `--dg-list-padding` | `0px` | Padding around the list body |

---

## DataGridChat (Message Timeline View)

Renders row data as a message timeline. It supports loading older rows from the top, preserving scroll offset after prepends, and automatically staying at the bottom when the user is already near the latest message.

```tsx
import { DataGridChat } from '@loykin/gridkit'

const columns = [
  { accessorKey: 'author' },
  { accessorKey: 'body' },
  { accessorKey: 'createdAt' },
]

export function MessageTimeline() {
  return (
    <DataGridChat
      data={messages}
      columns={columns}
      getRowId={(message) => message.id}
      containerHeight={640}
      hasPreviousPage={hasPreviousPage}
      isFetchingPreviousPage={isFetchingPreviousPage}
      fetchPreviousPage={fetchPreviousPage}
      renderMessage={(row) => <MessageBubble message={row.original} />}
      renderTypingIndicator={() => <TypingIndicator />}
    />
  )
}
```

### `DataGridChat`-only Props

Chat views use the shared row/data/filtering props, but omit table-only options such as column resizing, pinning, headers, table width modes, and checkbox selection.

| Prop | Type | Default | Description |
|---|---|---|---|
| `renderMessage` | `(row: Row<T>) => ReactNode` | — | **Required.** Render function for each message |
| `renderDaySeparator` | `(row, previousRow) => ReactNode` | — | Optional non-row separator before a message |
| `renderUnreadMarker` | `(row) => ReactNode` | — | Optional non-row marker before a message |
| `renderTypingIndicator` | `() => ReactNode` | — | Optional content after the latest message |
| `hasPreviousPage` | `boolean` | — | Whether older rows exist |
| `isFetchingPreviousPage` | `boolean` | — | Show loading indicator at the top |
| `fetchPreviousPage` | `() => void` | — | Called when the top sentinel enters the viewport |
| `rootMargin` | `string` | `'100px'` | IntersectionObserver `rootMargin` for early trigger |
| `stickToBottom` | `boolean` | `true` | Auto-scroll when the user is already near the bottom |
| `bottomThreshold` | `number` | `48` | Distance in px considered “at bottom” |
| `onAtBottomChange` | `(atBottom: boolean) => void` | — | Called when bottom state changes |
| `containerHeight` | `string \| number \| 'auto'` | `'auto'` | Preferred chat container height |
| `tableHeight` | `string \| number \| 'auto'` | `'auto'` | Compatibility alias for `containerHeight` |
| `classNames` | `DataGridChatClassNames` | — | Slot-based class injection for chat elements |

---

## DataGridCard (Card / Gallery View)

Renders rows as a responsive card grid instead of a table. All filtering, sorting, global search, and infinite scroll work identically to `DataGridInfinity` — only the visual output changes.

### Basic usage

```tsx
import { DataGridCard, GlobalSearch } from '@loykin/gridkit'

const columns = [
  { accessorKey: 'name' },
  { accessorKey: 'category', meta: { filterType: 'select' } },
  { accessorKey: 'price' },
]

export function ProductGrid() {
  return (
    <DataGridCard
      data={products}
      columns={columns}
      minCardWidth={240}
      minColumns={2}
      enableSorting
      headerRight={(table) => <GlobalSearch table={table} placeholder="Search…" />}
      renderCard={(row) => (
        <div className="rounded-lg border p-4">
          <h3 className="font-semibold">{row.original.name}</h3>
          <p className="text-sm text-muted-foreground">{row.original.category}</p>
          <p className="mt-2 font-medium">${row.original.price}</p>
        </div>
      )}
    />
  )
}
```

### With infinite scroll

```tsx
<DataGridCard
  data={data}
  columns={columns}
  renderCard={(row) => <ProductCard product={row.original} />}
  minCardWidth={240}
  minColumns={2}
  hasNextPage={hasNextPage}
  isFetchingNextPage={isFetchingNextPage}
  fetchNextPage={fetchNextPage}
/>
```

### Layout modes

| Props | CSS generated | Behaviour |
|---|---|---|
| `minCardWidth={240}` | `repeat(auto-fill, minmax(240px, 1fr))` | Responsive — 1 col on mobile, 4+ on desktop |
| `minCardWidth={240} minColumns={2}` | `repeat(auto-fill, minmax(min(240px, 50%), 1fr))` | Responsive, but never fewer than 2 columns |
| `cardColumns={4}` | `repeat(4, 1fr)` | Always exactly 4 columns |

### `DataGridCard`-only Props

All [shared props](#shared-props-datagrid-datagridinfinity-datagriddag-datagridcard) apply. Additional props:

| Prop | Type | Default | Description |
|---|---|---|---|
| `renderCard` | `(row: Row<T>) => ReactNode` | — | **Required.** Render function for each card |
| `minCardWidth` | `number` | `240` | Minimum card width in px — column count adjusts automatically |
| `minColumns` | `number` | `1` | The grid never collapses below this number of columns |
| `cardColumns` | `number` | — | Fixed column count — overrides `minCardWidth` and `minColumns` |
| `hasNextPage` | `boolean` | — | Whether more pages exist |
| `isFetchingNextPage` | `boolean` | — | Show loading indicator at the bottom |
| `fetchNextPage` | `() => void` | — | Called when the sentinel enters the viewport |
| `rootMargin` | `string` | `'100px'` | IntersectionObserver `rootMargin` for early trigger |

### Card CSS variables

| Variable | Default | Description |
|---|---|---|
| `--dg-card-gap` | `16px` | Gap between cards |
| `--dg-card-padding` | `16px` | Padding around the grid |

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
      filterType: 'text',   // 'text' | 'select' | 'multi-select' | 'number' | 'date' | 'date-range' | 'datetime' | 'datetime-range' | 'custom' | false
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

Grouped headers use TanStack's nested `columns` shape:

```tsx
const columns: DataGridColumnDef<User>[] = [
  {
    id: 'identity',
    header: 'Identity',
    columns: [
      { accessorKey: 'name', header: 'Name' },
      { accessorKey: 'email', header: 'Email' },
    ],
  },
  {
    id: 'activity',
    header: 'Activity',
    columns: [
      { accessorKey: 'status', header: 'Status' },
      { accessorKey: 'lastSeen', header: 'Last Seen' },
    ],
  },
]
```

### Column `meta` Reference

| Field | Type | Description |
|---|---|---|
| `flex` | `number` | Flex ratio — distributes remaining container width proportionally |
| `width` | `number` | Fixed preferred column width in px |
| `autoSize` | `boolean` | Auto-fit column width to content via canvas text measurement |
| `minWidth` | `number` | Minimum column width in px |
| `maxWidth` | `number` | Maximum column width in px |
| `align` | `'left' \| 'center' \| 'right'` | Cell text alignment |
| `pin` | `'left' \| 'right'` | Pin column at definition level |
| `wrap` | `boolean` | Allow multi-line content; row height adjusts automatically |
| `filterType` | `'text' \| 'select' \| 'multi-select' \| 'number' \| 'date' \| 'date-range' \| 'datetime' \| 'datetime-range' \| 'custom' \| false` | Filter input type for this column |
| `backendField` | `string` | Field name sent to `DataStoreBackend` query/facet params. Defaults to the column id |
| `actions` | `(row: T) => Action[]` | Row action menu items |

---

## Props

### Shared Props (`DataGrid`, `DataGridInfinity`, `DataGridDrag`, `DataGridCard`)

| Prop | Type | Default | Description |
|---|---|---|---|
| `data` | `T[]` | `[]` | Row data |
| `dataStore` | `DataStore<T>` | — | Map-based store for real-time updates. Mutually exclusive with `data` |
| `queryMode` | `'client' \| 'backend'` | `'client'` | In backend mode, sorting, filtering, search, and pagination call `dataStore.query()` |
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
| `enableMultiSort` | `boolean` | `false` | Enable Shift+click multi-column sorting |
| `maxMultiSortColCount` | `number` | `3` | Maximum sorted columns when multi-sort is enabled |
| `initialSorting` | `SortingState` | — | Initial sort state |
| `onSortingChange` | `(s: SortingState) => void` | — | Called on sort change |
| `manualSorting` | `boolean` | `false` | Disable client-side sort — handle externally |
| **Filtering** ||||
| `enableColumnFilters` | `boolean` | `false` | Show per-column filter UI |
| `filterDisplay` | `'row' \| 'icon'` | `'row'` | Filter as dedicated row or icon inside header cell |
| `customFilterComponents` | `Record<string, ComponentType<CustomFilterProps<T>>>` | — | Register custom filter UI by `filterType` |
| `manualFiltering` | `boolean` | `false` | Disable client-side filtering — handle externally |
| `columnFilters` | `ColumnFiltersState` | — | Controlled column filter state |
| `onColumnFiltersChange` | `(f: ColumnFiltersState) => void` | — | Called on filter change |
| `globalFilter` | `string` | — | Controlled global search value |
| `onGlobalFilterChange` | `(v: string) => void` | — | Called on global search change |
| `searchableColumns` | `string[]` | — | Column keys included in global search |
| `headerLeft` | `ReactNode \| (table: Table<T>) => ReactNode` | — | Toolbar content on the left. Function form receives the table instance |
| `headerRight` | `ReactNode \| (table: Table<T>) => ReactNode` | — | Toolbar content on the right. Function form receives the table instance |

Custom filter UI can replace any built-in filter type, including date/time filters:

```tsx
import type { CustomFilterProps } from '@loykin/gridkit'

function MyDateTimeRangeFilter<T extends object>({
  value,
  onChange,
  close,
}: CustomFilterProps<T>) {
  const [start = '', end = ''] = Array.isArray(value) ? value as [string, string] : ['', '']

  return (
    <DateTimeRangePicker
      start={start}
      end={end}
      onChange={(nextStart, nextEnd) => onChange([nextStart, nextEnd])}
      onApply={close}
    />
  )
}

<DataGrid
  columns={[
    { accessorKey: 'timestamp', header: 'Time', meta: { filterType: 'datetime-range' } },
  ]}
  enableColumnFilters
  filterDisplay="icon"
  customFilterComponents={{
    'datetime-range': MyDateTimeRangeFilter,
  }}
/>
```

| **Column Sizing** ||||
| `enableColumnResizing` | `boolean` | `true` | Enable drag-to-resize columns |
| `columnResizeMode` | `'onChange' \| 'onEnd'` | `'onChange'` | When resize updates are applied |
| `columnSizingMode` | `'auto' \| 'flex' \| 'fixed'` | `'flex'` | Column width strategy |
| `columnSizing` | `ColumnSizingState` | — | Initial column widths |
| `onColumnSizingChange` | `(s: ColumnSizingState) => void` | — | Called on column resize |
| **Visibility & Pinning** ||||
| `visibilityState` | `VisibilityState` | — | Controlled column visibility |
| `onColumnVisibilityChange` | `(v: VisibilityState) => void` | — | Called when column visibility changes |
| `initialPinning` | `ColumnPinningState` | — | Initial pinned columns `{ left: [...], right: [...] }` |
| **Row Expansion** ||||
| `enableExpanding` | `boolean` | `false` | Enable collapsible sub-rows |
| `getSubRows` | `(row: T, index: number) => T[] \| undefined` | — | Extract sub-rows from a row item |
| **Selection** ||||
| `checkboxConfig` | `CheckboxConfig<T>` | — | Row checkbox selection configuration |
| **State Persistence** ||||
| `tableKey` | `string` | — | Key for in-memory Zustand state persistence |
| `syncState` | `boolean` | `false` | Sync pagination and search state (requires `tableKey`) |
| `statePersistence` | `GridKitStatePersistence` | — | Load/save grid preferences through localStorage, backend APIs, etc. Requires `tableKey` |
| **Callbacks** ||||
| `onTableReady` | `(table: Table<T>) => void` | — | Called when TanStack Table instance is ready |
| `onColumnOrderChange` | `(order: string[]) => void` | — | Called when column order changes via drag |
| `onColumnPinningChange` | `(pinning: ColumnPinningState) => void` | — | Called when column pinning changes |
| **Advanced** ||||
| `tableOptions` | `PassthroughTableOptions<T>` | — | Escape hatch for advanced TanStack Table options |

```tsx
<DataGrid
  tableKey="users-grid"
  statePersistence={{
    load: async (tableKey) => api.get(`/grid-preferences/${tableKey}`),
    save: async (tableKey, state) => {
      await api.put(`/grid-preferences/${tableKey}`, state)
    },
    debounce: 500,
    include: [
      'columnSizing',
      'columnOrder',
      'columnPinning',
      'columnVisibility',
      'sorting',
      'pageSize',
    ],
  }}
/>
```

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
  headerLeft={(table) => (
    <>
      <GlobalSearch table={table} placeholder="Search…" />
      <SelectFilter table={table} columnId="status" label="Status" />
      <MultiSelectFilter table={table} columnId="department" label="Dept" />
    </>
  )}
  headerRight={(table) => <ColumnVisibilityDropdown table={table} />}
  ...
/>
```

---

## Backend Query Mode

Use `queryMode="backend"` when the grid should hold only the current backend result window while sorting, filtering, global search, and pagination are translated into backend-neutral query params.

GridKit owns the grid lifecycle and query state. Your backend owns data semantics: REST params, SQL, IndexedDB queries, cache policy, polling, schema setup, and domain-specific filter behavior.

```tsx
import {
  DataGrid,
  DataGridPaginationBar,
  GlobalSearch,
  useDataStore,
  useDataStoreQueryState,
} from '@loykin/gridkit'
import type { DataStoreBackend, QueryParams } from '@loykin/gridkit'

interface AuditEvent {
  id: string
  user: string
  action: string
  status: string
}

const backend: DataStoreBackend<AuditEvent> = {
  capabilities: {
    filtering: true,
    sorting: true,
    pagination: true,
    globalSearch: true,
    facets: true,
  },
  async query(params: QueryParams) {
    // Translate params.filters / params.globalFilter / params.sort
    // / params.limit / params.offset into REST, SQL, IndexedDB, etc.
    return fetchAuditEvents(params)
  },
  async getFacets(params) {
    // Optional: values for select and multi-select filter UIs.
    return fetchAuditFacetValues(params)
  },
}

const columns = [
  { accessorKey: 'user', meta: { filterType: 'text', backendField: 'user_name' } },
  { accessorKey: 'action', meta: { filterType: 'multi-select' } },
  { accessorKey: 'status', meta: { filterType: 'select' } },
]

export function AuditGrid() {
  const store = useDataStore<AuditEvent>({
    getRowId: (row) => row.id,
    backend,
  })
  const queryState = useDataStoreQueryState(store)

  return (
    <DataGrid
      dataStore={store}
      queryMode="backend"
      columns={columns}
      enableColumnFilters
      filterDisplay="icon"
      enableMultiSort
      isLoading={queryState.isHydrating || queryState.isQuerying}
      error={queryState.error}
      headerLeft={(table) => <GlobalSearch table={table} />}
      pagination={{ pageSize: 100 }}
      footer={(table) => (
        <DataGridPaginationBar table={table} totalCount={queryState.total} />
      )}
    />
  )
}
```

### Query Contract

```ts
type FilterOperator =
  | 'eq' | 'neq'
  | 'in' | 'notIn'
  | 'like' | 'startsWith' | 'endsWith'
  | 'empty' | 'notEmpty'
  | 'range'
  | 'gt' | 'gte' | 'lt' | 'lte'

interface FilterExpr {
  field: string
  op: FilterOperator
  value?: unknown
}

interface SortExpr {
  field: string
  desc?: boolean
}

interface QueryParams {
  filters?: FilterExpr[]
  globalFilter?: string
  sort?: SortExpr[]
  limit?: number
  offset?: number
}
```

`field` is `column.meta.backendField` when provided, otherwise the column id. GridKit does not generate SQL, know schemas, escape database paths, poll APIs, or choose fallback/cache policy.

When query criteria change, backend mode resets pagination to page 0 before querying. This avoids sending a stale offset from the previous result set.

### Facets

`getFacets` is optional. When present, `select` and `multi-select` filter options are loaded from the backend instead of scanning the current page.

```ts
interface FacetParams {
  field: string
  filters?: FilterExpr[]
  globalFilter?: string
  limit?: number
}

interface FacetResult {
  values: string[]
  truncated?: boolean
  hasEmpty?: boolean
}
```

Facet requests exclude the current column's own filter but include the other active filters and global search.

### Transactions

`applyTransaction()` is the synchronous local path for realtime updates. If `persist: true` is set, GridKit fires `backend.applyTransaction()` without awaiting it.

`applyTransactionAsync()` is persistence-first. When `persist: true`, it awaits `backend.applyTransaction()` before updating the in-memory store; if the backend write fails, local rows are not changed.

```ts
const result = await store.applyTransactionAsync({
  update: [{ id: row.id, data: { status: 'done' } }],
  persist: true,
})

if (!result.ok) {
  reportError(result.error)
}
```

### Capabilities

`backend.capabilities` is optional. In development, GridKit warns when `queryMode="backend"` uses a feature the backend declares unsupported.

```ts
const backend: DataStoreBackend<Row> = {
  capabilities: {
    filtering: true,
    sorting: false,
    pagination: true,
  },
  query,
}
```

---

## Server-Side Sorting & Filtering

This is the lower-level manual alternative to `queryMode="backend"`. Use it when the application wants to own all query orchestration and pass only the current page rows into `data`.

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

## Internal Architecture Notes

GridKit treats `src/core/table` as the built-in table composition layer, not as a feature-free rendering primitive. It owns the standard DataGrid table structure and composes the built-in feature slices used by the default grid experience:

- sorting indicators
- header filter controls
- pinning and resize controls
- row action triggers
- inline editing cell content
- selection, expansion, and reordering integration

The `src/features/*` folders contain reusable built-in feature slices. Importing those slices from `core/table` is intentional for the current architecture. A stricter slot/injection model can be introduced later if GridKit needs a plugin system or alternate table renderers, but it should start as an internal refactor rather than a public extension API.

Good future candidates for partial injection, if the coupling starts to hurt:

- `DataGridBodyCell`: editable cell content and row action trigger
- `DataGridFilterRow`: built-in filter controls
- `DataGridHeaderCell`: sort, filter, pinning, and resize controls

Until then, keep `core/engine` backend-neutral, keep filter-specific option/facet loading in `features/filters`, and avoid moving product/domain behavior into GridKit.

---

## License

MIT

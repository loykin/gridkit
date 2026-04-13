# @loykin/data-grid

A feature-rich React DataGrid component with virtualization, sorting, filtering, pagination, and infinite scroll.

## Features

- **Virtualization** — renders only visible rows via `@tanstack/react-virtual` for large datasets
- **Sorting** — client-side and server-side (manual) sorting
- **Column Filters** — per-column filter row with `text`, `select`, `number` types (AG Grid style)
- **Global Search** — searchable columns with a toolbar search input
- **Pagination** — built-in pagination bar with configurable page sizes
- **Infinite Scroll** — `DataGridInfinity` with IntersectionObserver-based next-page loading
- **Column Resizing** — drag-to-resize column widths
- **Column Pinning** — pin columns left or right
- **Column Visibility** — show/hide columns via toolbar dropdown
- **Row Selection** — checkbox selection with select-all support
- **Row Actions** — per-row action menu (`⋯` button) defined at the column level
- **Custom Scrollbars** — consistent cross-platform scrollbars (Windows & Mac)
- **Row Wrap** — per-column `meta.wrap` for multi-line cell content
- **State Persistence** — optional Zustand-based persistence of column sizing/visibility

---

## Installation

```bash
npm install @loykin/data-grid
```

### Peer Dependencies

```bash
npm install react react-dom
```

---

## CSS Setup

Import the stylesheet once in your app entry point:

```ts
import '@loykin/data-grid/styles'
```

### Theming with CSS Variables

The library uses a `--dg-*` CSS variable namespace to avoid conflicts with your app's global styles.

**With shadcn/ui** — works out of the box. The `--dg-*` variables automatically fall back to your existing shadcn CSS variables (`--background`, `--foreground`, `--border`, etc.).

**Standalone (no shadcn/ui)** — hardcoded defaults are applied automatically.

**Custom theme** — override only the `--dg-*` variables you need:

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

#### All Available `--dg-*` Variables

| Variable                    | Description                        |
|-----------------------------|------------------------------------|
| `--dg-background`           | Table / cell background            |
| `--dg-foreground`           | Default text color                 |
| `--dg-popover`              | Dropdown / popover background      |
| `--dg-popover-foreground`   | Dropdown text color                |
| `--dg-primary`              | Primary accent (checkboxes, etc.)  |
| `--dg-primary-foreground`   | Text on primary backgrounds        |
| `--dg-secondary`            | Secondary background               |
| `--dg-secondary-foreground` | Secondary text                     |
| `--dg-muted`                | Muted / subtle background          |
| `--dg-muted-foreground`     | Muted text (placeholders, hints)   |
| `--dg-accent`               | Hover / accent background          |
| `--dg-accent-foreground`    | Accent text                        |
| `--dg-destructive`          | Destructive action color           |
| `--dg-border`               | Border color                       |
| `--dg-input`                | Input border color                 |
| `--dg-ring`                 | Focus ring color                   |
| `--dg-radius`               | Border radius base value           |

---

## Basic Usage

### DataGrid (with Pagination)

```tsx
import { DataGrid } from '@loykin/data-grid'
import '@loykin/data-grid/styles'

const columns = [
  { accessorKey: 'id',   header: 'ID'   },
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email',header: 'Email'},
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
import { DataGridInfinity } from '@loykin/data-grid'

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

## Column Definition

Columns follow `@tanstack/react-table`'s `ColumnDef` with additional `meta` options:

```tsx
const columns: DataGridColumnDef<User>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    size: 200,
    meta: {
      flex: 1,           // stretch to fill remaining width proportionally
      autoSize: true,    // auto-fit to content width
      minWidth: 100,
      maxWidth: 400,
      align: 'left',     // 'left' | 'center' | 'right'
      pin: 'left',       // pin column: 'left' | 'right'
      wrap: true,        // allow multi-line cell content
      filterType: 'text',// 'text' | 'select' | 'number' | false
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
    id: 'actions',
    header: '',
    meta: {
      actions: (row) => [
        { label: 'Edit',   onClick: (row) => openEdit(row)   },
        { label: 'Delete', onClick: (row) => deleteRow(row), variant: 'destructive' },
      ],
    },
  },
]
```

---

## Props

### Shared Props (`DataGrid` and `DataGridInfinity`)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `data` | `T[]` | `[]` | Row data |
| `columns` | `DataGridColumnDef<T>[]` | — | Column definitions |
| `error` | `Error \| null` | — | Display error state |
| `isLoading` | `boolean` | — | Show loading skeleton |
| `emptyMessage` | `string` | — | Message when data is empty |
| `tableHeight` | `string \| number \| 'auto'` | `'auto'` | Fixed height for the table body. Set a value to enable internal scrolling and custom scrollbars |
| `rowHeight` | `number` | `33` | Row height in px (also sets virtualizer estimate) |
| `estimateRowHeight` | `number` | — | Override virtualizer estimate independently of `rowHeight` |
| `overscan` | `number` | `10` | Rows to render outside the visible area |
| `bordered` | `boolean` | `false` | Show vertical dividers between columns |
| `enableSorting` | `boolean` | `false` | Enable column sorting |
| `initialSorting` | `SortingState` | — | Initial sort state |
| `onSortingChange` | `(s: SortingState) => void` | — | Called on sort change |
| `manualSorting` | `boolean` | `false` | Server-side sorting |
| `enableColumnFilters` | `boolean` | `false` | Show per-column filter row |
| `columnFilters` | `ColumnFiltersState` | — | Controlled filter state |
| `globalFilter` | `string` | — | Controlled global search value |
| `onGlobalFilterChange` | `(v: string) => void` | — | Called on global search change |
| `searchableColumns` | `string[]` | — | Column keys included in global search |
| `leftFilters` | `(table) => ReactNode` | — | Custom filter UI on the left side of the toolbar |
| `rightFilters` | `(table) => ReactNode` | — | Custom filter UI on the right side of the toolbar |
| `enableColumnResizing` | `boolean` | `false` | Enable drag-to-resize columns |
| `columnSizingMode` | `'auto' \| 'flex' \| 'fixed'` | `'auto'` | Column width strategy |
| `tableWidthMode` | `'spacer' \| 'fill-last' \| 'independent'` | `'spacer'` | How remaining width is distributed |
| `visibilityState` | `VisibilityState` | — | Controlled column visibility |
| `initialPinning` | `ColumnPinningState` | — | Initial pinned columns `{ left: [...], right: [...] }` |
| `checkboxConfig` | `CheckboxConfig<T>` | — | Row selection configuration |
| `onRowClick` | `(row: T) => void` | — | Row click handler |
| `rowCursor` | `boolean` | `false` | Show pointer cursor on rows |
| `tableKey` | `string` | — | Key for state persistence |
| `persistState` | `boolean` | `false` | Persist column sizing/visibility via Zustand |
| `onTableReady` | `(table: Table<T>) => void` | — | Called when TanStack Table instance is ready |
| `onColumnSizingChange` | `(sizing: ColumnSizingState) => void` | — | Called on column resize |

### `DataGrid`-only Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enablePagination` | `boolean` | `false` | Show pagination bar |
| `paginationConfig` | `{ pageSize?: number; initialPageIndex?: number }` | — | Pagination defaults |
| `pageSizes` | `number[]` | — | Available page size options |
| `totalCount` | `number` | — | Server-side total row count for manual pagination |
| `onPageChange` | `(pageIndex, pageSize) => void` | — | Called on page change |

### `DataGridInfinity`-only Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `hasNextPage` | `boolean` | — | Whether more pages exist |
| `isFetchingNextPage` | `boolean` | — | Show loading indicator at bottom |
| `fetchNextPage` | `() => void` | — | Called to load next page |
| `rootMargin` | `string` | — | IntersectionObserver `rootMargin` to trigger early loading |

### `CheckboxConfig<T>`

```ts
interface CheckboxConfig<T> {
  getRowId: (row: T) => string
  selectedIds: Set<string>
  onSelectAll: (rows: Row<T>[], checked: boolean) => void
  onSelectOne: (rowId: string, checked: boolean) => void
}
```

---

## Column `meta` Reference

| Field | Type | Description |
|-------|------|-------------|
| `flex` | `number` | Flex ratio — distributes remaining container width proportionally |
| `autoSize` | `boolean` | Auto-fit column to content width via canvas text measurement |
| `minWidth` | `number` | Minimum column width in px |
| `maxWidth` | `number` | Maximum column width in px |
| `align` | `'left' \| 'center' \| 'right'` | Cell text alignment |
| `pin` | `'left' \| 'right'` | Pin column (fixed at column definition level) |
| `wrap` | `boolean` | Allow multi-line content; row height adjusts automatically |
| `filterType` | `'text' \| 'select' \| 'number' \| false` | Filter input type for this column |
| `actions` | `(row: T) => Action[]` | Row action menu items |

---

## Server-Side Data Example

```tsx
export function ServerSideTable() {
  const [sorting, setSorting] = useState<SortingState>([])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [page, setPage] = useState({ index: 0, size: 20 })

  const { data, total } = useServerData({ sorting, columnFilters, globalFilter, ...page })

  return (
    <DataGrid
      data={data}
      columns={columns}
      totalCount={total}
      enablePagination
      manualSorting
      enableSorting
      initialSorting={sorting}
      onSortingChange={setSorting}
      columnFilters={columnFilters}
      globalFilter={globalFilter}
      onGlobalFilterChange={setGlobalFilter}
      onPageChange={(index, size) => setPage({ index, size })}
      tableHeight={500}
    />
  )
}
```

---

## License

MIT

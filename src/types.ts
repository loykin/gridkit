import type { ReactNode } from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  Row,
  SortingState,
  Table,
  TableOptions,
  VisibilityState,
} from '@tanstack/react-table'
import type { DataStore } from './core/engine/DataStore'

// ColumnMeta and Table augmentations live in the extension files:
//   src/core/engine/extensions/ColumnFlexFeature.ts    — flex, autoSize, align, wrap, etc.
//   src/core/engine/extensions/ColumnFilterExtension.ts — filterType
//   src/core/engine/extensions/RowActionsFeature.ts    — actions
//   src/core/engine/extensions/DataStoreFeature.ts     — applyTransaction, getRowNodeById

export type DataGridColumnDef<T extends object> = ColumnDef<T, unknown>

/**
 * Safe pass-through for advanced TanStack Table options.
 * State ownership, event handlers, row models, and manual-policy keys are
 * excluded — those are managed internally or exposed as explicit props.
 * Pass as `tableOptions` on any DataGrid component.
 */
export type PassthroughTableOptions<T extends object> = Omit<
  TableOptions<T>,
  // State ownership
  | 'data' | 'columns' | 'state' | 'getRowId'
  // Event handlers (owned internally)
  | 'onSortingChange' | 'onColumnFiltersChange' | 'onGlobalFilterChange'
  | 'onColumnVisibilityChange' | 'onColumnSizingChange' | 'onPaginationChange'
  | 'onExpandedChange'
  // Row models (built conditionally based on props)
  | 'getCoreRowModel' | 'getSortedRowModel' | 'getFilteredRowModel'
  | 'getPaginationRowModel' | 'getExpandedRowModel'
  // Manual-policy keys exposed as individual props
  | 'manualSorting' | 'manualPagination' | 'manualFiltering'
  // Internal extension hook
  | '_features'
>

export type ColumnSizingMode = 'auto' | 'flex' | 'fixed'

/**
 * Table width handling strategy:
 * - 'spacer': Each column independent px + spacer cell fills remaining space (default)
 * - 'fill-last': Last visible column stretches to fill remaining space
 * - 'independent': Each column independent px, no fill — right gap when columns are narrow
 */
export type TableWidthMode = 'spacer' | 'fill-last' | 'independent'

export interface CheckboxConfig<T extends object> {
  getRowId: (row: T) => string
  selectedIds: Set<string>
  onSelectAll: (rows: Row<T>[], checked: boolean) => void
  onSelectOne: (rowId: string, checked: boolean) => void
}

/**
 * Rendering props owned by DataGridTableView.
 * DataGridBaseProps and DataGridTableViewProps both extend this
 * so these are declared exactly once.
 */
/**
 * Slot-based class injection for DataGrid elements.
 * Each key targets a specific part of the table structure.
 * User-supplied classes are merged after library defaults via cn(),
 * so Tailwind classes here will take precedence over library defaults.
 */
export interface DataGridClassNames {
  /** Outermost wrapper div (border, rounded-md) */
  container?: string
  /** Header panel div (bg-muted, overflow:hidden) */
  header?: string
  /** Individual header cell div */
  headerCell?: string
  /** Body row div */
  row?: string
  /** Body cell div */
  cell?: string
}

export interface TableViewConfig<T extends object> {
  isLoading?: boolean
  emptyMessage?: string
  /**
   * No data일 때 body 영역에 표시할 커스텀 UI.
   * 제공 시 emptyMessage보다 우선 적용됨.
   */
  emptyContent?: ReactNode
  /** 테이블 헤더 표시 여부. 기본값 true. */
  showHeader?: boolean
  onRowClick?: (row: T) => void
  rowCursor?: boolean
  enableColumnResizing?: boolean
  /** Show per-column filter row below the header (AG Grid style) */
  enableColumnFilters?: boolean
  /**
   * Controls how column filters are displayed when enableColumnFilters=true.
   * - 'row' (default): dedicated filter row below the header
   * - 'icon': filter icon inside each header cell that opens a popover
   */
  filterDisplay?: 'row' | 'icon'
  tableHeight?: string | number | 'auto'
  /** Show vertical dividers between columns */
  bordered?: boolean
  /**
   * Table width handling strategy:
   * - 'spacer': Each column independent px + spacer cell fills remaining space (default)
   * - 'fill-last': Last visible column stretches to fill remaining space
   * - 'independent': Each column independent px, no fill — right gap when columns are narrow
   */
  tableWidthMode?: TableWidthMode
  /**
   * Fixed row height in px. Sets both the actual CSS min-height of each row
   * and the virtualizer's estimateSize so they stay in sync. Default: 33.
   * Rows with meta.wrap=true can still grow beyond this height — measureElement
   * will track the actual size for accurate virtual positioning.
   */
  rowHeight?: number
  /**
   * Override the virtualizer's estimated row height independently of rowHeight.
   * Only needed for variable-height rows where you want a different estimate.
   */
  estimateRowHeight?: number
  /** Rows to render outside the visible area (virtualizer overscan, default: 10) */
  overscan?: number
  /** Slot-based class injection for individual table elements */
  classNames?: DataGridClassNames
}

export interface DataGridBaseProps<T extends object> extends TableViewConfig<T> {
  data?: T[]
  /**
   * Map-based external store for real-time / high-frequency updates.
   * Use with useDataStore() and table.applyTransaction().
   * Mutually exclusive with the `data` prop — set one or the other.
   */
  dataStore?: DataStore<T>
  columns: DataGridColumnDef<T>[]
  error?: Error | null

  // Sorting
  enableSorting?: boolean
  initialSorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  manualSorting?: boolean

  // Server-side filtering
  /** Set true when filtering is handled server-side. Disables client-side getFilteredRowModel. */
  manualFiltering?: boolean
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  searchableColumns?: string[]
  leftFilters?: (table: Table<T>) => React.ReactNode
  rightFilters?: (table: Table<T>) => React.ReactNode

  // Column sizing & visibility
  /**
   * Controls when column resize updates are applied.
   * - 'onChange' (default): live update while dragging
   * - 'onEnd': update only when drag ends
   */
  columnResizeMode?: 'onChange' | 'onEnd'
  visibilityState?: VisibilityState
  /** Initial column pinning — { left: ['id', ...], right: ['id', ...] } */
  initialPinning?: ColumnPinningState
  columnSizingMode?: ColumnSizingMode

  // Tree expanding
  /** Enable row expansion (requires subRows in data or getSubRows) */
  enableExpanding?: boolean
  /**
   * Extract sub-rows from a row for tree display.
   * If omitted, TanStack Table looks for a 'subRows' key on each data item.
   */
  getSubRows?: (originalRow: T, index: number) => T[] | undefined

  // Selection
  checkboxConfig?: CheckboxConfig<T>

  // State persistence (Zustand)
  tableKey?: string
  /**
   * Sync table state (pagination, search) to the in-memory Zustand store so it
   * survives re-renders within the same session. Requires tableKey to be set.
   * Note: in-memory only — does not persist across page reloads.
   */
  syncState?: boolean

  // Callbacks
  onTableReady?: (table: Table<T>) => void
  onColumnSizingChange?: (sizing: ColumnSizingState) => void

  /**
   * Escape hatch for advanced TanStack Table options not exposed as individual props.
   * Commonly used: `meta`, `autoResetPageIndex`, `autoResetColumnFilters`,
   * `autoResetGlobalFilter`, `autoResetSorting`, `defaultColumn`, `debugTable`.
   * Explicit DataGrid props always take precedence over values passed here.
   */
  tableOptions?: PassthroughTableOptions<T>
}

export interface DataGridProps<T extends object> extends DataGridBaseProps<T> {
  enablePagination?: boolean
  paginationConfig?: { pageSize?: number; initialPageIndex?: number }
  pageSizes?: number[]
  /** Server-side total row count for manual pagination */
  totalCount?: number
  onPageChange?: (pageIndex: number, pageSize: number) => void
}

export interface DataGridDragProps<T extends object> extends DataGridBaseProps<T> {
  /** Required: stable unique id per data item — used to track row identity across reorders */
  getRowId: (originalRow: T, index: number) => string
  /** Called with the full reordered data array after each drag */
  onRowReorder: (newData: T[]) => void
}

export interface DataGridInfinityProps<T extends object> extends DataGridBaseProps<T> {
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  /** IntersectionObserver rootMargin to trigger next page load */
  rootMargin?: string
}

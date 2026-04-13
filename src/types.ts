import type React from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  Row,
  SortingState,
  Table,
  VisibilityState,
} from '@tanstack/react-table'

// Augment TanStack Table ColumnMeta with our custom fields
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    /** CSS flex ratio — remaining container width distributed proportionally */
    flex?: number
    /** Auto-fit to content width via canvas text measurement */
    autoSize?: boolean
    minWidth?: number
    maxWidth?: number
    align?: 'left' | 'center' | 'right'
    /** Pin this column to the left or right — fixed at column definition level */
    pin?: 'left' | 'right'
    /**
     * Allow cell content to wrap to multiple lines.
     * Row height adjusts automatically via the virtualizer's measureElement.
     * When false (default) content is truncated with an ellipsis.
     */
    wrap?: boolean
    /**
     * Column-level filter type (renders filter row under the header).
     * - 'text'   : free-text contains match (default when enableColumnFilters=true)
     * - 'select' : dropdown of unique values from current data
     * - 'number' : numeric range (min / max)
     * - false    : disable filter for this column
     */
    filterType?: 'text' | 'select' | 'number' | false
    /**
     * Row action menu items. DataGrid renders a ⋯ trigger button in this
     * column and manages a single shared dropdown at the table level —
     * no per-row dropdown instances, popup survives data refreshes.
     */
    actions?: (row: TData) => Array<{
      label: string
      onClick: (row: TData) => void
      variant?: 'default' | 'destructive'
      disabled?: boolean
      icon?: React.ReactNode
    }>
  }
}

export type DataGridColumnDef<T extends object> = ColumnDef<T, unknown>

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
export interface TableViewConfig<T extends object> {
  isLoading?: boolean
  emptyMessage?: string
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
}

export interface DataGridBaseProps<T extends object> extends TableViewConfig<T> {
  data?: T[]
  columns: DataGridColumnDef<T>[]
  error?: Error | null

  // Sorting
  enableSorting?: boolean
  initialSorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  manualSorting?: boolean

  // Server-side filtering
  columnFilters?: ColumnFiltersState
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  searchableColumns?: string[]
  leftFilters?: (table: Table<T>) => React.ReactNode
  rightFilters?: (table: Table<T>) => React.ReactNode

  // Column sizing & visibility
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
  persistState?: boolean

  // Callbacks
  onTableReady?: (table: Table<T>) => void
  onColumnSizingChange?: (sizing: ColumnSizingState) => void
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

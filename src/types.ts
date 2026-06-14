import type { ReactNode } from 'react'
import type React from 'react'
import type {
  ColumnDef,
  ColumnFiltersState,
  ColumnPinningState,
  ColumnSizingState,
  Column,
  GroupingState,
  Row,
  SortingState,
  Table,
  TableOptions,
  VisibilityState,
  PaginationState,
} from '@tanstack/react-table'
import type { DataStore } from './core/engine/store/DataStore'

// ColumnMeta and Table augmentations live in the extension files:
//   src/core/engine/tanstack/ColumnFlexFeature.ts   — flex, autoSize, align, wrap, etc.
//   src/core/engine/tanstack/ColumnFilterFeature.ts — filterType
//   src/core/engine/tanstack/RowActionsFeature.ts   — actions
//   src/core/engine/tanstack/DataStoreFeature.ts    — applyTransaction, getRowNodeById

export type DataGridColumnDef<T extends object> = ColumnDef<T, unknown>
export type GridKitHeaderSlot<T extends object> =
  | ReactNode
  | ((table: Table<T>) => ReactNode)

/**
 * Icon overrides for DataGrid.
 * Each slot accepts any React node — an SVG component, img, span, etc.
 * Omitted slots fall back to the default lucide-react icons.
 */
export interface DataGridIcons {
  /** Sort ascending indicator (column sorted A→Z / low→high) */
  sortAsc?: React.ReactNode
  /** Sort descending indicator (column sorted Z→A / high→low) */
  sortDesc?: React.ReactNode
  /** Neutral sort indicator shown on sortable columns with no sort applied */
  sortNone?: React.ReactNode
  /** Icon inside the header filter icon button (filterDisplay="icon") */
  filter?: React.ReactNode
  /** Icon for the number-range filter button */
  filterRange?: React.ReactNode
  /** Icon for clear-filter / clear-search buttons */
  clearFilter?: React.ReactNode
  /** Icon for the row-actions trigger button (3-dot menu) */
  rowActions?: React.ReactNode
  /** Icon for the column-visibility toggle button */
  columnVisibility?: React.ReactNode
  /** Loading / fetching-next-page spinner */
  loading?: React.ReactNode
  /** Pagination: go to first page */
  pageFirst?: React.ReactNode
  /** Pagination: go to previous page */
  pagePrev?: React.ReactNode
  /** Pagination: go to next page */
  pageNext?: React.ReactNode
  /** Pagination: go to last page */
  pageLast?: React.ReactNode
  /** Global search input prefix icon */
  search?: React.ReactNode
  /** Tree row expand icon */
  treeExpand?: React.ReactNode
  /** Tree row collapse icon */
  treeCollapse?: React.ReactNode
  /** Row drag-handle icon */
  dragHandle?: React.ReactNode
  /** Master-detail row expand icon */
  detailExpand?: React.ReactNode
  /** Master-detail row collapse icon */
  detailCollapse?: React.ReactNode
  /** Pin column to the left */
  pinLeft?: React.ReactNode
  /** Pin column to the right */
  pinRight?: React.ReactNode
  /** Unpin column */
  pinOff?: React.ReactNode
  /** Column header menu trigger button icon */
  columnMenu?: React.ReactNode
}

/**
 * Pre-resolved feature flags passed as the 4th argument to renderColumnMenu.
 * Each flag combines the global grid prop with per-column meta/canXxx checks,
 * so custom menu implementations don't need to re-derive what's enabled.
 */
export interface ColumnMenuContext {
  /** Column can be sorted (enableSorting && col.getCanSort()) */
  canSort: boolean
  /** Column can be filtered (enableColumnFilters && filterType !== false) */
  canFilter: boolean
  /** Column can be pinned (enableColumnPinning && col.getCanPin()) */
  canPin: boolean
}

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
  | 'onExpandedChange' | 'onColumnOrderChange' | 'onColumnPinningChange'
  // Row models (built conditionally based on props)
  | 'getCoreRowModel' | 'getSortedRowModel' | 'getFilteredRowModel'
  | 'getPaginationRowModel' | 'getExpandedRowModel'
  // Manual-policy keys exposed as individual props
  | 'manualSorting' | 'manualPagination' | 'manualFiltering'
  // Internal extension hook
  | '_features'
>

export type ColumnSizingMode = 'auto' | 'flex' | 'fixed'
export type DataGridQueryMode = 'client' | 'backend'
export type HeaderGroupLayout = 'padded' | 'span'

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

/** Slot-based class names shared across all GridKit views. */
export interface GridKitClassNames {
  root?: string
  toolbar?: string
  frame?: string
  content?: string
  header?: string
  body?: string
  footer?: string
  empty?: string
  error?: string
  loading?: string
  loadMore?: string
}

/** Slot-based inline styles shared across all GridKit views. Same keys as GridKitClassNames. */
export interface GridKitStyles {
  root?: React.CSSProperties
  toolbar?: React.CSSProperties
  frame?: React.CSSProperties
  content?: React.CSSProperties
  header?: React.CSSProperties
  body?: React.CSSProperties
  footer?: React.CSSProperties
  empty?: React.CSSProperties
  error?: React.CSSProperties
  loading?: React.CSSProperties
  loadMore?: React.CSSProperties
}

export interface DataGridClassNames extends GridKitClassNames {
  headerCell?: string
  row?: string
  cell?: string
}

export interface DataGridStyles extends GridKitStyles {
  headerCell?: React.CSSProperties
  row?: React.CSSProperties
  cell?: React.CSSProperties
}

export interface DataGridCardClassNames extends GridKitClassNames {
  card?: string
}

export interface DataGridCardStyles extends GridKitStyles {
  card?: React.CSSProperties
}

export interface DataGridListClassNames extends GridKitClassNames {
  item?: string
}

export interface DataGridListStyles extends GridKitStyles {
  item?: React.CSSProperties
}

// Note: loadMore is not used in Chat — chat loads backward via loadPrevious
export interface DataGridChatClassNames extends GridKitClassNames {
  messageWrapper?: string
  daySeparator?: string
  unreadMarker?: string
  typingIndicator?: string
  loadPrevious?: string
}

export interface DataGridChatStyles extends GridKitStyles {
  messageWrapper?: React.CSSProperties
  daySeparator?: React.CSSProperties
  unreadMarker?: React.CSSProperties
  typingIndicator?: React.CSSProperties
  loadPrevious?: React.CSSProperties
}

export interface DataGridAgentChatClassNames extends DataGridChatClassNames {
  event?: string
  message?: string
  toolCall?: string
  toolResult?: string
  artifact?: string
  status?: string
  user?: string
  assistant?: string
  system?: string
  tool?: string
  label?: string
  eventBody?: string
  code?: string
  actions?: string
}

export interface DataGridAgentChatStyles extends DataGridChatStyles {
  event?: React.CSSProperties
  message?: React.CSSProperties
  toolCall?: React.CSSProperties
  toolResult?: React.CSSProperties
  artifact?: React.CSSProperties
  status?: React.CSSProperties
  user?: React.CSSProperties
  assistant?: React.CSSProperties
  system?: React.CSSProperties
  tool?: React.CSSProperties
  label?: React.CSSProperties
  eventBody?: React.CSSProperties
  code?: React.CSSProperties
  actions?: React.CSSProperties
}

export type GridKitScrollbarMode = 'native' | 'custom' | 'hidden'

export interface GridKitScrollbarConfig {
  /** Scrollbar rendering mode. Defaults to custom for non-table views. */
  mode?: GridKitScrollbarMode
  /** Track thickness when mode="custom". Defaults to var(--gridkit-scrollbar-size). */
  size?: number | string
  /** Extra class for the custom scrollbar track. */
  trackClassName?: string
  /** Extra class for the custom scrollbar thumb. */
  thumbClassName?: string
  /** Inline style for the custom scrollbar track. */
  trackStyle?: React.CSSProperties
  /** Inline style for the custom scrollbar thumb. */
  thumbStyle?: React.CSSProperties
}

export interface GridKitRowsContext<T extends object> {
  rows: Row<T>[]
  containerRef: React.RefObject<HTMLElement | null>
  wrapperRef: React.RefObject<HTMLElement | null>
  isLoading?: boolean
  error?: Error | null
}

export interface GridKitTableContext<T extends object> extends GridKitRowsContext<T> {
  table: Table<T>
}

export interface CustomFilterProps<T extends object, V = unknown> {
  column: Column<T, unknown>
  table: Table<T>
  value: V
  onChange: (value: V | undefined) => void
  close?: () => void
  backend?: {
    field?: string
    filterType?: 'text' | 'multi-select' | 'range' | false
    sortable?: boolean
  }
}

export type CustomFilterComponents<T extends object> = Record<
  string,
  React.ComponentType<CustomFilterProps<T, unknown>>
>

/**
 * Per-column filter UI configuration. Set via `column.meta.filterParams`.
 * Each filter type reads only the fields relevant to it.
 */
export interface FilterParams {
  /**
   * Filter popover width in px. Applies to icon-mode filter popovers and the
   * row-mode multi-select popup. Does not affect the column menu popover width.
   * Overrides per-type defaults (192px; datetime: 280px).
   */
  width?: number
  /**
   * Multi-select: max height of the scrollable options list in px.
   * Default: 192. Increase for columns with many distinct values.
   */
  maxOptionsHeight?: number
  /** Text filter: placeholder string. Default: 'Filter…' */
  placeholder?: string
}

export type GridKitPersistedStateKey =
  | 'columnSizing'
  | 'columnOrder'
  | 'columnPinning'
  | 'columnVisibility'
  | 'sorting'
  | 'columnFilters'
  | 'globalFilter'
  | 'pageSize'

export interface GridKitPersistedState {
  columnSizing?: ColumnSizingState
  columnOrder?: string[]
  columnPinning?: ColumnPinningState
  columnVisibility?: VisibilityState
  sorting?: SortingState
  columnFilters?: ColumnFiltersState
  globalFilter?: string
  pageSize?: number
  pagination?: Partial<PaginationState>
}

export interface GridKitStatePersistence {
  load?: (tableKey: string) => Promise<Partial<GridKitPersistedState> | null | undefined> | Partial<GridKitPersistedState> | null | undefined
  save: (tableKey: string, state: Partial<GridKitPersistedState>) => Promise<void> | void
  debounce?: number
  include?: GridKitPersistedStateKey[]
}

/**
 * Display-layer props shared between GridKitCoreProps and TableViewConfig.
 * Defined once here so both interfaces stay in sync automatically.
 */
export interface GridKitDisplayProps<T extends object> {
  isLoading?: boolean
  emptyMessage?: string
  /**
   * Custom UI rendered in the body area when there is no data.
   * Takes precedence over emptyMessage when provided.
   */
  emptyContent?: ReactNode
  onRowClick?: (row: T) => void
  rowCursor?: boolean
  /**
   * Let the grid fit within an explicit parent height while preserving natural
   * height for short content. When content exceeds the available space, only
   * the table body scrolls and the footer remains visible below the table.
   */
  fillContainer?: boolean
  /**
   * Fill the height provided by the parent layout. Use this when the parent
   * already owns sizing, such as a tab, drawer, split pane, or dashboard panel.
   * The parent must provide a real height, usually with `height` or a flex
   * chain that includes `min-height: 0`.
   */
  fillParent?: boolean
  tableHeight?: string | number | 'auto'
  /** Cap the container height — content shorter than this grows naturally, taller gets a scrollbar. */
  maxTableHeight?: string | number
  /** Floor the container height — content taller than this grows naturally, shorter keeps this minimum. */
  minTableHeight?: string | number
}

export interface GridKitCoreProps<T extends object> extends GridKitDisplayProps<T> {
  data?: T[]
  /**
   * Map-based external store for real-time / high-frequency updates.
   * Mutually exclusive with the `data` prop — set one or the other.
   */
  dataStore?: DataStore<T>
  /**
   * Backend mode connects sorting, filtering, search, and pagination state to
   * dataStore.query(). It requires dataStore and keeps GridKit backend-neutral.
   */
  queryMode?: DataGridQueryMode
  columns: DataGridColumnDef<T>[]
  error?: Error | null

  // Sorting
  enableSorting?: boolean
  /** Enable Shift+click multi-column sorting. Defaults to false. */
  enableMultiSort?: boolean
  /** Maximum number of columns that can be sorted at once when multi-sort is enabled. */
  maxMultiSortColCount?: number
  initialSorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  manualSorting?: boolean

  // Filtering and search
  /** Set true when filtering is handled server-side. Disables client-side getFilteredRowModel. */
  manualFiltering?: boolean
  columnFilters?: ColumnFiltersState
  onColumnFiltersChange?: (filters: ColumnFiltersState) => void
  globalFilter?: string
  onGlobalFilterChange?: (value: string) => void
  searchableColumns?: string[]

  /** Content rendered on the left side of the shared toolbar area. */
  headerLeft?: GridKitHeaderSlot<T>
  /** Content rendered on the right side of the shared toolbar area. */
  headerRight?: GridKitHeaderSlot<T>

  /** Preferred name for non-table view scroll container height. */
  containerHeight?: string | number | 'auto'

  /**
   * Return a stable unique string ID for each row.
   * Defaults to row index — override this when your data has a natural ID field.
   */
  getRowId?: (originalRow: T, index: number) => string

  // State persistence (Zustand)
  tableKey?: string
  /**
   * Sync table state (pagination, search) to the in-memory Zustand store so it
   * survives re-renders within the same session. Requires tableKey to be set.
   */
  syncState?: boolean
  /**
   * Persist user grid preferences to an external adapter such as localStorage
   * or a backend API. Requires tableKey to be set.
   */
  statePersistence?: GridKitStatePersistence

  // Callbacks
  onTableReady?: (table: Table<T>) => void

  /**
   * Icon overrides. Any omitted slot falls back to the default lucide-react icon.
   */
  icons?: DataGridIcons

  /**
   * Escape hatch for advanced TanStack Table options not exposed as individual props.
   */
  tableOptions?: PassthroughTableOptions<T>
}

export interface TableViewConfig<T extends object> extends GridKitDisplayProps<T> {
  /** Whether to show the header row. Defaults to true. */
  showHeader?: boolean
  /**
   * Header group layout mode.
   * - 'padded': render TanStack placeholder header cells as empty cells (default)
   * - 'span': ungrouped leaf headers span the remaining header height
   */
  headerGroupLayout?: HeaderGroupLayout
  enableColumnResizing?: boolean
  /** Show per-column filter row below the header (AG Grid style) */
  enableColumnFilters?: boolean
  /**
   * Register custom filter UIs by filterType. Built-in filterFns still run
   * unless the column supplies its own filterFn.
   */
  customFilterComponents?: CustomFilterComponents<T>
  /**
   * Controls how column filters are displayed when enableColumnFilters=true.
   * - 'row' (default): dedicated filter row below the header
   * - 'icon': filter icon inside each header cell that opens a popover
   */
  filterDisplay?: 'row' | 'icon'
  /** Show vertical dividers between columns */
  bordered?: boolean
  /** Enable drag-to-reorder columns by dragging the header */
  enableColumnReordering?: boolean
  /**
   * Render a custom detail panel below each row.
   * Use ExpandToggleCell in a column to let users open/close the panel.
   */
  renderDetailRow?: (row: Row<unknown>) => ReactNode
  /** Show a pin/unpin menu button inside each column header */
  enableColumnPinning?: boolean
  /**
   * Replace individual header icons (sort/filter/pin) with a single ⋮ menu button per column.
   * Useful when columns are narrow. Works alongside enableSorting, enableColumnFilters, enableColumnPinning.
   */
  enableColumnMenu?: boolean
  /**
   * Custom content rendered inside the column menu popover.
   * When provided, replaces the default sort/filter/pin items.
   * Use this to plug in shadcn, MUI, or any other menu component.
   * ctx contains pre-resolved flags (global props × per-column meta) so custom renders
   * don't need to re-derive what's enabled.
   */
  renderColumnMenu?: (col: Column<T>, table: Table<T>, close: () => void, ctx: ColumnMenuContext) => ReactNode
  /** Called when the user commits an inline cell edit */
  onCellValueChange?: (rowId: string, columnId: string, value: unknown) => void
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
  /** Custom renderer for group header rows. Defaults to showing column value and sub-row count. */
  renderGroupRow?: (row: Row<T>) => ReactNode
  /** Slot-based class injection for individual table elements */
  classNames?: DataGridClassNames
  /** Slot-based inline styles for individual table elements */
  styles?: DataGridStyles
}

export interface DataGridBaseProps<T extends object> extends GridKitCoreProps<T>, TableViewConfig<T> {
  // Column sizing & visibility
  /**
   * Initial column sizing state. When provided, these widths are used on mount
   * and treated as user-set (auto-measurement will not overwrite them).
   * Pair with onColumnSizingChange to persist widths externally:
   *   localStorage, URL query, backend, etc.
   */
  columnSizing?: ColumnSizingState
  /**
   * Controls when column resize updates are applied.
   * - 'onChange' (default): live update while dragging
   * - 'onEnd': update only when drag ends
   */
  columnResizeMode?: 'onChange' | 'onEnd'
  /** Controlled column visibility state. Pair with onColumnVisibilityChange. */
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

  // Row Grouping
  /** Enable grouping rows by column value. Set column IDs via `grouping` or column meta `enableGrouping`. */
  enableGrouping?: boolean
  /** Controlled grouping state — array of column IDs to group by. */
  grouping?: GroupingState
  /** Called when grouping changes. */
  onGroupingChange?: (grouping: GroupingState) => void

  // Selection
  checkboxConfig?: CheckboxConfig<T>

  // Callbacks
  onColumnSizingChange?: (sizing: ColumnSizingState) => void
  /** Called when column visibility changes. Required for controlled visibilityState updates. */
  onColumnVisibilityChange?: (visibility: VisibilityState) => void
  /** Called when the user drags a column header to a new position */
  onColumnOrderChange?: (order: string[]) => void
  /** Called when column pinning changes at runtime via the pin menu */
  onColumnPinningChange?: (pinning: ColumnPinningState) => void
}

/**
 * Pagination configuration. Presence of this prop enables TanStack pagination.
 * Omit entirely to disable pagination (e.g. DataGridDrag, DataGridInfinity).
 */
export interface DataGridPaginationConfig {
  /** Initial page size. Default: 20 */
  pageSize?: number
  /**
   * Controlled page index (0-based).
   * When provided, the caller owns the current page and should update this
   * value in response to onPageChange.
   */
  pageIndex?: number
  /** Initial page index (0-based). Default: 0 */
  initialPageIndex?: number
  /**
   * Total page count for server-side (manual) pagination.
   * When set, TanStack Table runs in manualPagination mode and will not
   * slice rows client-side — the caller is responsible for fetching the
   * correct slice and calling onPageChange.
   */
  pageCount?: number
  /** Called whenever the page index or page size changes */
  onPageChange?: (pageIndex: number, pageSize: number) => void
}

export interface DataGridProps<T extends object> extends DataGridBaseProps<T> {
  /**
   * Enables TanStack Table pagination. Presence of this prop activates the
   * pagination row model. Omit to disable pagination entirely.
   * @example
   * // Client-side
   * pagination={{ pageSize: 20 }}
   * // Server-side
   * pagination={{ pageSize: 20, pageCount: Math.ceil(total / 20), onPageChange: fetchPage }}
   */
  pagination?: DataGridPaginationConfig
  /**
   * Render the footer area (e.g. pagination bar).
   * Receives the live TanStack Table instance — same pattern as function-valued header slots.
   * @example
   * footer={(table) => <DataGridPaginationBar table={table} pageSizes={[10, 20, 50]} />}
   */
  footer?: (table: Table<T>) => React.ReactNode
}

export type DataGridTableProps<T extends object> = DataGridProps<T>

export interface DataGridDragProps<T extends object> extends Omit<DataGridBaseProps<T>, 'enableSorting' | 'enableMultiSort' | 'maxMultiSortColCount'> {
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

export interface DataGridCardProps<T extends object> extends DataGridBaseProps<T> {
  /** Render function for each card. Receives the TanStack Row — use row.original for data. */
  renderCard: (row: Row<T>) => ReactNode
  /**
   * Fixed column count. When set, minCardWidth and minColumns are ignored.
   * @example cardColumns={4} → always 4 columns
   */
  cardColumns?: number
  /**
   * Minimum card width in px for responsive auto-fill layout.
   * Columns are calculated automatically: floor(containerWidth / minCardWidth).
   * Default: 240
   */
  minCardWidth?: number
  /**
   * Minimum number of columns — cards will never collapse below this count.
   * Default: 1
   * @example minColumns={2} → always at least 2 columns even on mobile
   */
  minColumns?: number
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  /** IntersectionObserver rootMargin to trigger next page load */
  rootMargin?: string
  /** Static footer content rendered below the card container. */
  footer?: ReactNode
  /** Slot-based class injection for card elements */
  classNames?: DataGridCardClassNames
  /** Slot-based inline styles for card elements */
  styles?: DataGridCardStyles
  /** Scrollbar rendering for the card scroll container. Defaults to custom. */
  scrollbar?: GridKitScrollbarConfig
  /**
   * Enable row-group virtualization.
   * Requires containerHeight, tableHeight, or maxTableHeight.
   * This virtualizes horizontal card bands, not individual masonry cards.
   */
  enableVirtualization?: boolean
  /**
   * Estimated height in px for one virtualized card row.
   * A card row is one horizontal band containing N cards.
   * Use the tallest expected card height in that row.
   * Default: 200
   */
  estimateCardHeight?: number
  /** Virtualizer overscan row count. Default: 3 */
  overscan?: number
}

export interface DataGridListProps<T extends object> extends GridKitCoreProps<T> {
  /** Render function for each list item. Receives the TanStack Row — use row.original for data. */
  renderItem: (row: Row<T>) => ReactNode
  /** Override the React key for each rendered item. Defaults to row.id. */
  itemKey?: (row: Row<T>) => string
  /** Gap in px between list items. Defaults to 0. */
  itemGap?: number
  /** Padding in px around the list body. Defaults to 0. */
  itemPadding?: number
  /** Enable item virtualization. Requires containerHeight or tableHeight to be fixed. */
  enableVirtualization?: boolean
  /** Estimated item height in px for list virtualization. Defaults to 48. */
  estimateRowHeight?: number
  /** Items to render outside the visible area when virtualized. Defaults to 10. */
  overscan?: number
  /** Static footer content rendered below the list container. */
  footer?: ReactNode
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  fetchNextPage?: () => void
  /** IntersectionObserver rootMargin to trigger next page load */
  rootMargin?: string
  /** Slot-based class injection for list elements */
  classNames?: DataGridListClassNames
  /** Slot-based inline styles for list elements */
  styles?: DataGridListStyles
  /** Scrollbar rendering for the list scroll container. Defaults to custom. */
  scrollbar?: GridKitScrollbarConfig
}

export interface DataGridChatProps<T extends object> extends GridKitCoreProps<T> {
  /** Render function for each message row. Receives the TanStack Row — use row.original for data. */
  renderMessage: (row: Row<T>) => ReactNode
  renderDaySeparator?: (row: Row<T>, previousRow: Row<T> | undefined) => ReactNode
  renderUnreadMarker?: (row: Row<T>) => ReactNode
  renderTypingIndicator?: () => ReactNode
  hasPreviousPage?: boolean
  isFetchingPreviousPage?: boolean
  fetchPreviousPage?: () => void
  rootMargin?: string
  stickToBottom?: boolean
  bottomThreshold?: number
  onAtBottomChange?: (atBottom: boolean) => void
  /** Static footer content rendered below the chat container. */
  footer?: ReactNode
  /** Scrollbar rendering for the chat scroll container. Defaults to custom. */
  scrollbar?: GridKitScrollbarConfig
  classNames?: DataGridChatClassNames
  /** Slot-based inline styles for chat elements */
  styles?: DataGridChatStyles
}

export type AgentChatRole = 'user' | 'assistant' | 'system' | 'tool'
export type AgentChatStatus = 'pending' | 'running' | 'streaming' | 'complete' | 'error'

export interface AgentChatEventBase {
  id: string
  type: string
  status?: AgentChatStatus
  createdAt?: Date | string | number
  metadata?: Record<string, unknown>
}

export interface AgentChatMessageEvent extends AgentChatEventBase {
  type: 'message'
  role: AgentChatRole
  content: ReactNode
}

export interface AgentChatToolCallEvent extends AgentChatEventBase {
  type: 'tool_call'
  name: string
  input?: unknown
  status?: Extract<AgentChatStatus, 'pending' | 'running' | 'complete' | 'error'>
}

export interface AgentChatToolResultEvent extends AgentChatEventBase {
  type: 'tool_result'
  name: string
  output: unknown
}

export type GridKitTableColumnType = 'text' | 'number' | 'date' | 'boolean'

export interface GridKitTableColumn {
  key: string
  label: string
  type?: GridKitTableColumnType
  align?: 'left' | 'center' | 'right'
}

export interface GridKitTablePayload {
  type: 'gridkit-table'
  title?: string
  columns: GridKitTableColumn[]
  rows: Record<string, unknown>[]
}

/** JSON Schema for GridKitTablePayload — use directly as an AI tool/structured-output schema. */
export const GridKitTablePayloadSchema = {
  type: 'object',
  required: ['type', 'columns', 'rows'],
  additionalProperties: false,
  properties: {
    type:    { type: 'string', enum: ['gridkit-table'] },
    title:   { type: 'string' },
    columns: {
      type: 'array',
      items: {
        type: 'object',
        required: ['key', 'label'],
        additionalProperties: false,
        properties: {
          key:   { type: 'string' },
          label: { type: 'string' },
          type:  { type: 'string', enum: ['text', 'number', 'date', 'boolean'] },
          align: { type: 'string', enum: ['left', 'center', 'right'] },
        },
      },
    },
    rows: {
      type: 'array',
      items: { type: 'object', additionalProperties: true },
    },
  },
} as const

export interface AgentChatArtifactEvent extends AgentChatEventBase {
  type: 'artifact'
  kind: 'chart' | 'table' | 'image' | 'code' | string
  data: unknown
  title?: ReactNode
}

export interface AgentChatStatusEvent extends AgentChatEventBase {
  type: 'status'
  label?: ReactNode
}

export type AgentChatEvent =
  | AgentChatMessageEvent
  | AgentChatToolCallEvent
  | AgentChatToolResultEvent
  | AgentChatArtifactEvent
  | AgentChatStatusEvent
  | (AgentChatEventBase & Record<string, unknown>)

export type AgentChatAdapter<TInput, TEvent extends AgentChatEvent = AgentChatEvent> =
  | ((input: TInput) => readonly TEvent[])
  | {
      toEvents: (input: TInput) => readonly TEvent[]
    }

export interface AgentChatRenderContext<TEvent extends AgentChatEvent> {
  row: Row<TEvent>
  event: TEvent
}

export interface DataGridAgentChatProps<
  TEvent extends AgentChatEvent = AgentChatEvent,
  TInput = readonly TEvent[],
> extends Omit<
    DataGridChatProps<TEvent>,
    'data' | 'dataStore' | 'queryMode' | 'columns' | 'renderMessage' | 'getRowId' | 'classNames'
  > {
  /** Normalized agent events. Use this directly when your runtime already emits Gridkit events. */
  events?: readonly TEvent[]
  /** Provider-specific input converted through adapter. */
  input?: TInput
  /** Converts OpenAI, Anthropic, LangChain, Vercel AI, or custom agent data into Gridkit agent events. */
  adapter?: AgentChatAdapter<TInput, TEvent>
  /** Optional columns for search/filter state. Defaults to event type, role, status, name, and content fields. */
  columns?: DataGridColumnDef<TEvent>[]
  /** Override row identity. Defaults to event.id. */
  getEventId?: (event: TEvent, index: number) => string
  /** Full event renderer override. Receives the normalized event and TanStack row. */
  renderEvent?: (event: TEvent, context: AgentChatRenderContext<TEvent>) => ReactNode
  renderMessageContent?: (event: Extract<TEvent, { type: 'message' }>, context: AgentChatRenderContext<TEvent>) => ReactNode
  renderToolCall?: (event: Extract<TEvent, { type: 'tool_call' }>, context: AgentChatRenderContext<TEvent>) => ReactNode
  renderToolResult?: (event: Extract<TEvent, { type: 'tool_result' }>, context: AgentChatRenderContext<TEvent>) => ReactNode
  renderArtifact?: (event: Extract<TEvent, { type: 'artifact' }>, context: AgentChatRenderContext<TEvent>) => ReactNode
  renderStatus?: (event: Extract<TEvent, { type: 'status' }>, context: AgentChatRenderContext<TEvent>) => ReactNode
  renderEventActions?: (event: TEvent, context: AgentChatRenderContext<TEvent>) => ReactNode
  /** Slot and event-type class injection for chat shells, bubbles, content, code blocks, and actions. */
  classNames?: DataGridAgentChatClassNames
  /** Slot-based inline styles for agent chat elements */
  styles?: DataGridAgentChatStyles
  /** Per-event class hook. Useful for provider state, severity, pinned artifacts, or custom grouping. */
  getEventClassName?: (event: TEvent, context: AgentChatRenderContext<TEvent>) => string | undefined
  /** Per-event inline style hook for values that are naturally dynamic, such as accent colors or width. */
  getEventStyle?: (event: TEvent, context: AgentChatRenderContext<TEvent>) => React.CSSProperties | undefined
}

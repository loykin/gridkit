export {
  aggregationFns,
  assignTableAPIs,
  cellSelectionFeature,
  cellSpanningFeature,
  columnFacetingFeature,
  columnFilteringFeature,
  columnGroupingFeature,
  columnOrderingFeature,
  columnPinningFeature,
  columnResizingFeature,
  columnSizingFeature,
  columnVisibilityFeature,
  constructRow,
  createCoreRowModel,
  createExpandedRowModel,
  createFilteredRowModel,
  createGroupedRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  flexRender,
  globalFilteringFeature,
  makeObjectMap,
  rowAggregationFeature,
  rowExpandingFeature,
  rowPaginationFeature,
  rowPinningFeature,
  rowSelectionFeature,
  rowSortingFeature,
  skipFirstRun,
  sortFns,
  tableFeatures,
  tableMemo,
  useTable,
} from '@tanstack/react-table'

export type {
  ColumnFiltersState,
  ColumnOrderState,
  ColumnPinningState,
  ColumnSizingState,
  ExpandedState,
  GroupingState,
  PaginationState,
  RowData,
  SortingState,
  TableFeature,
  TableFeatures,
} from '@tanstack/react-table'

import type {
  Cell as TanStackCell,
  CellContext as TanStackCellContext,
  Column as TanStackColumn,
  ColumnDef as TanStackColumnDef,
  FilterFn as TanStackFilterFn,
  Header as TanStackHeader,
  HeaderGroup as TanStackHeaderGroup,
  Row as TanStackRow,
  RowData,
  RowModel as TanStackRowModel,
  ReactTable as TanStackReactTable,
  StockFeatures,
  Table as TanStackTable,
  TableFeature,
  TableOptions as TanStackTableOptions,
} from '@tanstack/react-table'

export interface GridKitTableFeatures extends StockFeatures {
  dataStoreFeature: TableFeature
  columnFlexFeature: TableFeature
  aggregationFns: typeof import('@tanstack/react-table').aggregationFns
  filterFns: typeof import('@tanstack/react-table').filterFns
  sortFns: typeof import('@tanstack/react-table').sortFns
  // TanStack's feature slot contract deliberately uses any at this registry boundary.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  coreRowModel: (table: any) => () => TanStackRowModel<any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filteredRowModel: (table: any) => () => TanStackRowModel<any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sortedRowModel: (table: any) => () => TanStackRowModel<any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  paginatedRowModel: (table: any) => () => TanStackRowModel<any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  expandedRowModel: (table: any) => () => TanStackRowModel<any, any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  groupedRowModel: (table: any) => () => TanStackRowModel<any, any>
}

/** Gridkit owns the concrete v9 feature set; these aliases keep its public API data-first. */
export type CoreTable<TData extends RowData> = TanStackTable<GridKitTableFeatures, TData>
export type Table<TData extends RowData> = TanStackReactTable<GridKitTableFeatures, TData>
export type Row<TData extends RowData> = TanStackRow<GridKitTableFeatures, TData>
export type Column<TData extends RowData, TValue = unknown> = TanStackColumn<GridKitTableFeatures, TData, TValue>
export type Cell<TData extends RowData, TValue = unknown> = TanStackCell<GridKitTableFeatures, TData, TValue>
export type Header<TData extends RowData, TValue = unknown> = TanStackHeader<GridKitTableFeatures, TData, TValue>
export type HeaderGroup<TData extends RowData> = TanStackHeaderGroup<GridKitTableFeatures, TData>
export type CellContext<TData extends RowData, TValue = unknown> = TanStackCellContext<GridKitTableFeatures, TData, TValue>
export type ColumnDef<TData extends RowData, TValue = unknown> = TanStackColumnDef<GridKitTableFeatures, TData, TValue>
export type FilterFn<TData extends RowData> = TanStackFilterFn<GridKitTableFeatures, TData>
export type RowModel<TData extends RowData> = TanStackRowModel<GridKitTableFeatures, TData>
export type TableOptions<TData extends RowData> = TanStackTableOptions<GridKitTableFeatures, TData>
export type VisibilityState = import('@tanstack/react-table').ColumnVisibilityState

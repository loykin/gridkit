import type { RowData, TableFeature } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * Set to false to hide the column menu button (⋮) for this column
     * when enableColumnMenu is active.
     */
    columnMenu?: false
    /**
     * Set to false to hide the standalone pin control while preserving the
     * column's programmatic and initial pinning capability.
     */
    pinControl?: false
  }
}

export const ColumnMenuFeature: TableFeature = {}

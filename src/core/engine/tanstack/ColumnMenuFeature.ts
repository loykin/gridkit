import type { RowData, TableFeatures } from '@/core/engine/tanstack/gridKitTable'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, in out TValue> {
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

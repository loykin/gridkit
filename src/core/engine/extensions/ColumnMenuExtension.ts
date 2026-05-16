import type { RowData, TableFeature } from '@tanstack/react-table'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * Set to false to hide the column menu button (⋮) for this column
     * when enableColumnMenu is active.
     */
    columnMenu?: false
  }
}

export const ColumnMenuFeature: TableFeature = {}

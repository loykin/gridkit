import type { RowData, TableFeature } from '@tanstack/react-table'

// ── Declaration merging ───────────────────────────────────────────────────────
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    /**
     * Column-level filter type (renders filter row under the header).
     * - 'text'         : free-text contains match (default when enableColumnFilters=true)
     * - 'select'       : dropdown of unique values from current data
     * - 'multi-select' : multiple values dropdown
     * - 'number'       : numeric range (min / max)
     * - 'date'         : exact date match
     * - 'date-range'   : date range (start / end)
     * - 'datetime'     : exact date-time match
     * - 'datetime-range': date-time range (start / end)
     * - 'custom'       : use a registered customFilterComponents entry
     * - false          : disable filter for this column
     */
    filterType?:
      | 'text'
      | 'select'
      | 'multi-select'
      | 'number'
      | 'date'
      | 'date-range'
      | 'datetime'
      | 'datetime-range'
      | 'custom'
      | false
    backendField?: string
    backendType?: 'string' | 'number' | 'date' | 'boolean' | 'json' | 'custom'
    backendPath?: string
  }
}

// ── Feature ───────────────────────────────────────────────────────────────────
// Type declaration only — filter rendering is handled in DataGridTableView.
export const ColumnFilterFeature: TableFeature = {}

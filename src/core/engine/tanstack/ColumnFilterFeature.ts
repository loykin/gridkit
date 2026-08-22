import type { RowData, TableFeatures } from '@/core/engine/tanstack/gridKitTable'
import type { FilterParams } from '@/types'

// ── Declaration merging ───────────────────────────────────────────────────────
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, in out TValue> {
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
    /**
     * Backend-only column metadata. Prefer this namespace for server query
     * mapping; backendField is kept for backwards compatibility.
     */
    backend?: {
      field?: string
      filterType?: 'text' | 'multi-select' | 'range' | false
      sortable?: boolean
    }
    backendField?: string
    /** Per-column filter UI configuration — width, maxOptionsHeight, placeholder, etc. */
    filterParams?: FilterParams
  }
}

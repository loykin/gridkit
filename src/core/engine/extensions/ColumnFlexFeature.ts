import type { ColumnSizingState, RowData, TableFeature, Table } from '@tanstack/react-table'

// ── Declaration merging ───────────────────────────────────────────────────────
declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
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
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Table<TData extends RowData> {
    /** Calculate flex/auto column widths relative to containerWidth */
    getFlexColumnSizing: (containerWidth: number) => ColumnSizingState
  }
}

// ── Feature ───────────────────────────────────────────────────────────────────
export const ColumnFlexFeature: TableFeature = {
  getDefaultColumnDef: () => ({ minSize: 60 }),

  createTable: (table) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ;(table as any).getFlexColumnSizing = (containerWidth: number): ColumnSizingState => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const columns = (table as unknown as Table<any>).getAllLeafColumns()
      const sizing: ColumnSizingState = {}

      const flexCols = columns.filter((col) => col.columnDef.meta?.flex != null)
      if (flexCols.length === 0) return sizing

      const fixedWidth = columns
        .filter((col) => col.columnDef.meta?.flex == null)
        .reduce((sum, col) => sum + col.getSize(), 0)

      const totalFlex = flexCols.reduce((sum, col) => sum + col.columnDef.meta!.flex!, 0)
      const available = Math.max(0, containerWidth - fixedWidth)
      let distributed = 0

      flexCols.forEach((col, i) => {
        const flex = col.columnDef.meta!.flex!
        const minW = col.columnDef.meta?.minWidth ?? 60
        const isLast = i === flexCols.length - 1
        const w = isLast
          ? Math.max(minW, available - distributed)
          : Math.max(minW, Math.floor((flex / totalFlex) * available))
        sizing[col.id] = w
        distributed += w
      })

      return sizing
    }
  },
}

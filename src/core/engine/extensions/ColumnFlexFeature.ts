import type { CellContext, ColumnSizingState, RowData, TableFeature } from '@tanstack/react-table'
import type { ReactNode } from 'react'

export interface EditCellProps<TData extends RowData, TValue = unknown> {
  value: TValue
  row: TData
  context: CellContext<TData, TValue>
  onCommit: (value: unknown) => void
  onCancel: () => void
}

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
     * Render an inline editor when the cell is double-clicked.
     * The editor is responsible for calling onCommit(value) or onCancel().
     * Requires onCellValueChange prop on the DataGrid.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    editCell?: (props: EditCellProps<any, any>) => ReactNode
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
    table.getFlexColumnSizing = (containerWidth: number): ColumnSizingState => {
      const columns = table.getAllLeafColumns()
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

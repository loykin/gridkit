import {
  assignTableAPIs,
  type CellContext,
  type ColumnSizingState,
  type RowData,
  type CoreTable,
  type TableFeature,
  type TableFeatures,
} from '@/core/engine/tanstack/gridKitTable'
import type { ReactNode } from 'react'

export interface EditCellProps<TData extends RowData, TValue = unknown> {
  value: TValue
  row: TData
  context: CellContext<TData, TValue>
  onCommit: (value: unknown) => void
  onCancel: () => void
}

// ── Declaration merging ───────────────────────────────────────────────────────
interface ColumnFlexTable {
  getFlexColumnSizing: (containerWidth: number) => ColumnSizingState
}

declare module '@tanstack/react-table' {
  interface Plugins {
    columnFlexFeature: TableFeature
  }

  interface Table_FeatureMap<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    in out TFeatures extends TableFeatures,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    in out TData extends RowData,
  > {
    columnFlexFeature: ColumnFlexTable
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<in out TFeatures extends TableFeatures, in out TData extends RowData, in out TValue> {
    /** CSS flex ratio — remaining container width distributed proportionally */
    flex?: number
    /** Fixed preferred column width in px. Mirrors TanStack's column size metadata used by examples. */
    width?: number
    /** Auto-fit to content width via canvas text measurement */
    autoSize?: boolean
    minWidth?: number
    maxWidth?: number
    align?: 'left' | 'center' | 'right'
    /** Pin this column to the logical start or end — fixed at column definition level */
    pin?: 'start' | 'end'
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
    /**
     * Override cell overflow per column. Default is clip.
     * Note: content can only escape the cell box — ancestor scroll containers
     * (overflow: auto/hidden) still clip at the table boundary. Use a portal
     * for dropdowns or popovers that must escape the table viewport.
     */
    cellOverflow?: 'visible' | 'hidden'
  }

}

// ── Feature ───────────────────────────────────────────────────────────────────
export const ColumnFlexFeature: TableFeature = {
  getDefaultColumnDef: () => ({ minSize: 60 }),

  constructTableAPIs: (table) => {
    assignTableAPIs('columnFlexFeature', table, {
      table_getFlexColumnSizing: { fn: (containerWidth: number): ColumnSizingState => {
      const columns = (table as unknown as CoreTable<RowData>).getAllLeafColumns()
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
      } },
    })
  },
}

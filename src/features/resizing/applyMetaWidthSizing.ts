import type { DataGridColumnDef } from '@/types'

/**
 * Maps meta.width onto the top-level TanStack `size` field when the caller
 * hasn't set `size` explicitly. Must run before columns reach both
 * useColumnSizing (raw columns, computes flex remaining-width) and
 * useReactTable (enriched columns, column.getSize() reads columnDef.size) —
 * otherwise the two consumers disagree on a fixed column's width in flex mode.
 */
export function applyMetaWidthSizing<T extends object>(
  columns: DataGridColumnDef<T>[],
): DataGridColumnDef<T>[] {
  return columns.map((col) => {
    const withChildren = 'columns' in col && col.columns
      ? { ...col, columns: applyMetaWidthSizing(col.columns) }
      : col

    if (withChildren.size == null && withChildren.meta?.width != null) {
      return { ...withChildren, size: withChildren.meta.width }
    }
    return withChildren
  })
}

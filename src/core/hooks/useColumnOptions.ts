import type { Table } from '@tanstack/react-table'

/**
 * Scans all core rows for a column and returns unique, sorted string values.
 * Used by toolbar filters and table filter cells to build option lists.
 */
export function getColumnOptions<T extends object>(table: Table<T>, columnId: string): string[] {
  const vals = new Set<string>()
  table.getCoreRowModel().rows.forEach((row) => {
    const v = row.getValue(columnId)
    if (v != null) vals.add(String(v))
  })
  return Array.from(vals).sort()
}

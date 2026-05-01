import { useCallback } from 'react'
import type { Table } from '@tanstack/react-table'

function escapeCSV(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

/**
 * Returns a function that exports the current table data to a CSV file.
 * Respects current column visibility, ordering, filters, and sorting.
 *
 * Usage:
 *   function ExportButton({ table }: { table: Table<Employee> }) {
 *     const exportCSV = useCSVExport(table)
 *     return <button onClick={exportCSV}>Export CSV</button>
 *   }
 */
export function useCSVExport<T extends object>(
  table: Table<T>,
  filename = 'export.csv',
): () => void {
  return useCallback(() => {
    const cols = table
      .getVisibleLeafColumns()
      .filter((col) => col.columnDef.meta?.filterType !== false && col.id !== 'select' && col.id !== 'drag' && col.id !== 'expand')

    const headerRow = cols
      .map((col) => escapeCSV(String(col.columnDef.header ?? col.id)))
      .join(',')

    const dataRows = table
      .getFilteredRowModel()
      .rows.map((row) =>
        cols
          .map((col) => escapeCSV(String(row.getValue(col.id) ?? '')))
          .join(','),
      )

    const csv = [headerRow, ...dataRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }, [table, filename])
}

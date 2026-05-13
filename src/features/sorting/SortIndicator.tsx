import type { Header } from '@tanstack/react-table'
import { useIcons } from '@/core/IconsContext'

interface SortIndicatorProps<T extends object> {
  header: Header<T, unknown>
}

export function SortIndicator<T extends object>({ header }: SortIndicatorProps<T>) {
  const icons = useIcons()
  const isLeafHeader = header.subHeaders.length === 0 && !header.isPlaceholder
  if (!isLeafHeader || !header.column.getCanSort()) return null

  const sorted = header.column.getIsSorted()

  return (
    <span className="dg-sort-icon">
      {sorted === 'asc'
        ? icons.sortAsc
        : sorted === 'desc'
          ? icons.sortDesc
          : icons.sortNone}
    </span>
  )
}

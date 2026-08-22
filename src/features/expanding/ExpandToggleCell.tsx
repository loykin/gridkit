import type { Row } from '@/core/engine/tanstack/gridKitTable'
import { useIcons } from '@/core/IconsContext'
import { Button } from '@/core/UIComponents'
import { useDetailRow } from './DetailRowContext'

interface ExpandToggleCellProps<TData extends object> {
  row: Row<TData>
}

/**
 * Toggle button for master-detail rows.
 * Place this in a dedicated column cell to expand/collapse the detail panel.
 *
 * Usage:
 *   { id: 'expand', size: 40, enableResizing: false, enableSorting: false,
 *     header: () => null,
 *     cell: ({ row }) => <ExpandToggleCell row={row} /> }
 */
export function ExpandToggleCell<TData extends object>({ row }: ExpandToggleCellProps<TData>) {
  const icons = useIcons()
  const ctx = useDetailRow()

  if (!ctx) return null

  const isExpanded = ctx.expandedRows.has(row.id)

  return (
    <Button
      aria-label={isExpanded ? 'Collapse detail row' : 'Expand detail row'}
      aria-expanded={isExpanded}
      variant="ghost"
      size="icon-xs"
      onClick={(e) => {
        e.stopPropagation()
        ctx.toggleRow(row.id)
      }}
      style={{ color: 'color-mix(in oklab, var(--gridkit-foreground) 60%, transparent)' }}
    >
      {isExpanded ? icons.detailCollapse : icons.detailExpand}
    </Button>
  )
}

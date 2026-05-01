import type { Row } from '@tanstack/react-table'
import { useIcons } from '@/core/IconsContext'
import { Button } from '@/components/ui/button'
import { useDetailRow } from './DetailRowContext'

interface ExpandToggleCellProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  row: Row<any>
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
export function ExpandToggleCell({ row }: ExpandToggleCellProps) {
  const icons = useIcons()
  const ctx = useDetailRow()

  if (!ctx) return null

  const isExpanded = ctx.expandedRows.has(row.id)

  return (
    <Button
      variant="ghost"
      size="icon-xs"
      onClick={(e) => {
        e.stopPropagation()
        ctx.toggleRow(row.id)
      }}
      style={{ color: 'color-mix(in oklab, var(--dg-foreground) 60%, transparent)' }}
    >
      {isExpanded ? icons.detailCollapse : icons.detailExpand}
    </Button>
  )
}

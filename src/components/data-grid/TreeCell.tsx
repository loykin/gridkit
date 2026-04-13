import React from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import type { Row } from '@tanstack/react-table'

interface TreeCellProps {
  row: Row<any>
  /** Indent per depth level in px (default: 16) */
  indentSize?: number
  children: React.ReactNode
}

/**
 * Wraps cell content with a depth-aware indent and expand/collapse toggle.
 * Drop this into whichever column should act as the tree "name" column.
 *
 * Usage:
 *   cell: ({ row }) => (
 *     <TreeCell row={row} indentSize={20}>
 *       <Icon /> <span>{row.original.name}</span>
 *     </TreeCell>
 *   )
 */
export function TreeCell({ row, indentSize = 16, children }: TreeCellProps) {
  const canExpand = row.getCanExpand()
  const indent = row.depth * indentSize

  return (
    <div style={{ paddingLeft: indent }} className="flex items-center gap-1 min-w-0">
      {canExpand ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); row.toggleExpanded() }}
          className="flex items-center justify-center w-5 h-5 shrink-0 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
        >
          {row.getIsExpanded()
            ? <ChevronDown className="h-3.5 w-3.5 text-foreground/60" />
            : <ChevronRight className="h-3.5 w-3.5 text-foreground/60" />}
        </button>
      ) : (
        // Leaf or non-expandable: spacer keeps content aligned with siblings
        <span className="w-5 h-5 shrink-0" />
      )}
      {children}
    </div>
  )
}

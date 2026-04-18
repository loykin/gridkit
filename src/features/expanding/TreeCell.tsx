import React from 'react'
import type { Row } from '@tanstack/react-table'
import { useIcons } from '@/core/IconsContext'

interface TreeCellProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const icons = useIcons()
  const canExpand = row.getCanExpand()
  const indent = row.depth * indentSize

  return (
    <div
      style={{
        paddingLeft: indent,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        minWidth: 0,
      }}
    >
      {canExpand ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            row.toggleExpanded()
          }}
          className="dg-btn dg-btn--tree-toggle"
          data-variant="ghost"
          data-size="icon-xs"
          style={{ color: 'color-mix(in oklab, var(--dg-foreground) 60%, transparent)' }}
        >
          {row.getIsExpanded() ? icons.treeCollapse : icons.treeExpand}
        </button>
      ) : (
        <span style={{ width: 20, height: 20, flexShrink: 0 }} />
      )}
      {children}
    </div>
  )
}

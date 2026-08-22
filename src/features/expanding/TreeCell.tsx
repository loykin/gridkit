import type { ReactNode } from 'react'
import type { Row } from '@/core/engine/tanstack/gridKitTable'
import { useIcons } from '@/core/IconsContext'

interface TreeCellProps<TData extends object> {
  row: Row<TData>
  /** Indent per depth level in px (default: 16) */
  indentSize?: number
  children: ReactNode
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
export function TreeCell<TData extends object>({
  row,
  indentSize = 16,
  children,
}: TreeCellProps<TData>) {
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
          aria-label={row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
          aria-expanded={row.getIsExpanded()}
          onClick={(e) => {
            e.stopPropagation()
            row.toggleExpanded()
          }}
          className="gridkit-btn gridkit-btn--tree-toggle"
          data-variant="ghost"
          data-size="icon-xs"
          style={{ color: 'color-mix(in oklab, var(--gridkit-foreground) 60%, transparent)' }}
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

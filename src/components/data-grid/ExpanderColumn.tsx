import { ChevronDown, ChevronRight } from 'lucide-react'
import type { ColumnDef, Row } from '@tanstack/react-table'

interface ExpanderColumnOptions {
  /** Width of the expander column in px (default: 32) */
  size?: number
  /** Indent per depth level in px (default: 16) */
  indentSize?: number
}

/**
 * Creates a fixed expander column for tree/group rows.
 *
 * Usage:
 *   columns={[createExpanderColumn(), ...myColumns]}
 *   enableExpanding
 *   getSubRows={(row) => row.children}
 *
 * - Expandable rows show a chevron toggle button
 * - Leaf rows at depth > 0 show an indent spacer
 * - depth * indentSize px of left padding is applied per level
 */
export function createExpanderColumn<T extends object>(
  options: ExpanderColumnOptions = {}
): ColumnDef<T, unknown> {
  const { size = 32, indentSize = 16 } = options

  return {
    id: '__expander__',
    size,
    enableResizing: false,
    enableSorting: false,
    enableColumnFilter: false,
    header: () => null,
    cell: ({ row }: { row: Row<T> }) => {
      const canExpand = row.getCanExpand()
      const indent = row.depth * indentSize

      return (
        <div style={{ paddingLeft: indent }} className="flex items-center">
          {canExpand ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                row.toggleExpanded()
              }}
              className="flex items-center justify-center w-5 h-5 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
            >
              {row.getIsExpanded()
                ? <ChevronDown className="h-3.5 w-3.5 text-foreground/60" />
                : <ChevronRight className="h-3.5 w-3.5 text-foreground/60" />
              }
            </button>
          ) : (
            // Leaf node at depth > 0: empty spacer to preserve alignment
            row.depth > 0 ? <span className="w-5 h-5 shrink-0" /> : null
          )}
        </div>
      )
    },
  }
}

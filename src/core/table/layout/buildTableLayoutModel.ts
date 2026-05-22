import type { Column } from '@tanstack/react-table'
import type { TableWidthMode } from '@/types'
import { getColumnsWidth, splitVisibleColumnsByPin } from '@/core/table/tableUtils'
import type { TableLayoutModel } from './tableLayoutTypes'

export interface BuildTableLayoutModelInput<T extends object> {
  visibleLeafColumns: Column<T>[]
  tableWidthMode: TableWidthMode
  enableColumnReordering: boolean
  hasVScroll: boolean
}

export function buildTableLayoutModel<T extends object>({
  visibleLeafColumns,
  tableWidthMode,
  enableColumnReordering,
  hasVScroll,
}: BuildTableLayoutModelInput<T>): TableLayoutModel<T> {
  const columns = splitVisibleColumnsByPin(visibleLeafColumns)
  const leftWidth = getColumnsWidth(columns.left)
  const centerWidth = getColumnsWidth(columns.center)
  const rightWidth = getColumnsWidth(columns.right)

  return {
    regions: {
      left: {
        id: 'left',
        columns: columns.left,
        width: leftWidth,
        tableWidthMode: 'independent',
        reorderEnabled: false,
        measureRows: false,
      },
      center: {
        id: 'center',
        columns: columns.center,
        width: centerWidth,
        tableWidthMode,
        reorderEnabled: enableColumnReordering,
        measureRows: true,
      },
      right: {
        id: 'right',
        columns: columns.right,
        width: rightWidth,
        tableWidthMode: 'independent',
        reorderEnabled: false,
        measureRows: false,
      },
    },
    gridTemplateColumns: `${leftWidth}px minmax(0, 1fr) ${rightWidth}px`,
    hasLeftRegion: leftWidth > 0,
    hasRightRegion: rightWidth > 0,
    centerWidth,
    horizontalScrollbarStyle: {
      marginLeft: leftWidth,
      marginRight: rightWidth + (hasVScroll ? 8 : 0),
    },
  }
}

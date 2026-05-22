import type React from 'react'
import type { Column } from '@tanstack/react-table'
import type { TableWidthMode } from '@/types'

export interface CenterColumnRegionModel<T extends object> {
  id: 'center'
  columns: Column<T>[]
  width: number
  tableWidthMode: TableWidthMode
  reorderEnabled: boolean
  measureRows: true
}

export interface PinnedColumnRegionModel<T extends object> {
  id: 'left' | 'right'
  columns: Column<T>[]
  width: number
  tableWidthMode: 'independent'
  reorderEnabled: false
  measureRows: false
}

export type ColumnRegionModel<T extends object> =
  | CenterColumnRegionModel<T>
  | PinnedColumnRegionModel<T>

export interface TableLayoutModel<T extends object> {
  regions: {
    left: PinnedColumnRegionModel<T>
    center: CenterColumnRegionModel<T>
    right: PinnedColumnRegionModel<T>
  }
  gridTemplateColumns: string
  hasLeftRegion: boolean
  hasRightRegion: boolean
  centerWidth: number
  horizontalScrollbarStyle: React.CSSProperties
}

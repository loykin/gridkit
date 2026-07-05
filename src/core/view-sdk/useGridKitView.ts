import type React from 'react'
import type { Row, Table } from '@tanstack/react-table'
import type { DataGridBaseProps, DataGridPaginationConfig } from '@/types'
import type { DataStoreQueryState } from '@/core/engine/store/DataStore'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'

export type GridKitViewOptions<T extends object> = DataGridBaseProps<T> & {
  pagination?: DataGridPaginationConfig
}

export interface GridKitViewContext<T extends object> {
  table: Table<T>
  rows: Row<T>[]
  wrapperRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  queryState: DataStoreQueryState
}

export function useGridKitView<T extends object>(options: GridKitViewOptions<T>): GridKitViewContext<T> {
  const { table, rows, wrapperRef, containerRef, queryState } = useDataGridBase(options)
  return { table, rows, wrapperRef, containerRef, queryState }
}

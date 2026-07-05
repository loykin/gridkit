import React, { createContext, useContext, useMemo } from 'react'
import type { GridKitLabels } from '@/types'

export const defaultLabels: GridKitLabels = {
  rowsPerPage: 'Rows per page',
  pageRange: ({ pageIndex, pageSize, pageCount, totalCount }) =>
    totalCount !== undefined
      ? `${pageIndex * pageSize + 1}-${Math.min((pageIndex + 1) * pageSize, totalCount)} of ${totalCount}`
      : `Page ${pageIndex + 1} of ${Math.max(pageCount, 1)}`,
  pageCompact: ({ pageIndex, pageCount }) => `${pageIndex + 1} / ${Math.max(pageCount, 1)}`,
  goToFirstPage: 'Go to first page',
  goToPreviousPage: 'Go to previous page',
  goToNextPage: 'Go to next page',
  goToLastPage: 'Go to last page',
  goToPage: (page) => `Go to page ${page}`,
  chooseVisibleColumns: 'Choose visible columns',
  toggleColumnVisibility: (column) => `Toggle ${column} column visibility`,
  filterColumn: (column) => `Filter ${column}`,
  clearColumnFilter: (column) => `Clear ${column} filter`,
  clearDateFilter: 'Clear date filter',
  clearNumberRangeFilter: 'Clear number range filter',
  clearSearch: 'Clear search',
  clear: 'Clear',
  min: 'Min',
  max: 'Max',
  expandGroup: 'Expand group',
  collapseGroup: 'Collapse group',
  grid: 'Data grid',
  noData: 'No data',
  noMessages: 'No messages',
}

const LabelsCtx = createContext<GridKitLabels>(defaultLabels)

export function LabelsProvider({
  labels,
  children,
}: {
  labels?: Partial<GridKitLabels>
  children: React.ReactNode
}) {
  const merged = useMemo(() => labels ? { ...defaultLabels, ...labels } : defaultLabels, [labels])
  return <LabelsCtx value={merged}>{children}</LabelsCtx>
}

export function useGridKitLabels(): GridKitLabels {
  return useContext(LabelsCtx)
}

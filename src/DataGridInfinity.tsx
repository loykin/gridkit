import type { DataGridInfinityProps } from '@/types'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'
import { useInfiniteScroll } from '@/core/hooks/useInfiniteScroll'
import { DataGridShell } from '@/core/DataGridShell'

export function DataGridInfinity<T extends object>(props: DataGridInfinityProps<T>) {
  const {
    error,
    leftFilters,
    rightFilters,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin = '100px',
    isLoading,
  } = props

  const { wrapperRef, containerRef, table, rows, isSized, measure } = useDataGridBase({
    ...props,
    enablePagination: false,
  })

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin,
    enabled: !isLoading,
  })

  return (
    <DataGridShell
      {...props}
      wrapperRef={wrapperRef}
      containerRef={containerRef}
      table={table}
      rows={rows}
      isSized={isSized}
      measure={measure}
      error={error}
      leftFilters={leftFilters}
      rightFilters={rightFilters}
      loadMoreRef={loadMoreRef}
      isFetchingNextPage={isFetchingNextPage}
    />
  )
}

import type { DataGridInfinityProps } from '@/types'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'
import { useInfiniteScroll } from '@/core/hooks/useInfiniteScroll'
import { DataGridShell } from '@/core/DataGridShell'
import { IconsProvider } from '@/core/IconsContext'
import { LabelsProvider } from '@/core/LabelsContext'

export function DataGridInfinity<T extends object>(props: DataGridInfinityProps<T>) {
  const {
    error,
    headerLeft,
    headerRight,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin = '100px',
    isLoading,
    icons,
  } = props

  const { wrapperRef, containerRef, table, rows, isSized, measure, queryState } = useDataGridBase({
    ...props,
    // Infinite scroll handles page loading via IntersectionObserver — no pagination needed.
    // Omitting pagination prop disables it entirely.
    pagination: undefined,
  })
  const effectiveError = error ?? (props.queryMode === 'backend' ? queryState.error : null)
  const effectiveIsLoading = isLoading ?? (props.queryMode === 'backend' && (queryState.isHydrating || queryState.isQuerying))

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin,
    enabled: !effectiveIsLoading,
  })

  return (
    <LabelsProvider labels={props.labels}>
      <IconsProvider icons={icons}>
        <DataGridShell
          {...props}
          wrapperRef={wrapperRef}
          containerRef={containerRef}
          table={table}
          rows={rows}
          isSized={isSized}
          measure={measure}
          error={effectiveError}
          headerLeft={headerLeft}
          headerRight={headerRight}
          loadMoreRef={loadMoreRef}
          isFetchingNextPage={isFetchingNextPage}
          isLoading={effectiveIsLoading}
        />
      </IconsProvider>
    </LabelsProvider>
  )
}

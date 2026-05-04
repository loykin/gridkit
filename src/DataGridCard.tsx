import type { DataGridCardProps } from '@/types'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'
import { useInfiniteScroll } from '@/core/hooks/useInfiniteScroll'
import { DataGridCardView } from '@/core/DataGridCardView'
import { IconsProvider } from '@/core/IconsContext'

export function DataGridCard<T extends object>(props: DataGridCardProps<T>) {
  const {
    error,
    leftFilters,
    rightFilters,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin = '100px',
    isLoading,
    icons,
    renderCard,
    cardColumns,
    minCardWidth,
    minColumns,
  } = props

  const { wrapperRef, containerRef, table, rows } = useDataGridBase({
    ...props,
    pagination: undefined,
    columnSizingMode: 'fixed',
  })

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin,
    enabled: !isLoading,
  })

  if (error) {
    return <div className="dg-error">{error.message}</div>
  }

  return (
    <IconsProvider icons={icons}>
      <DataGridCardView
        wrapperRef={wrapperRef}
        containerRef={containerRef}
        table={table}
        rows={rows}
        leftFilters={leftFilters}
        rightFilters={rightFilters}
        loadMoreRef={loadMoreRef}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        renderCard={renderCard}
        cardColumns={cardColumns}
        minCardWidth={minCardWidth}
        minColumns={minColumns}
        onRowClick={props.onRowClick}
        rowCursor={props.rowCursor}
        emptyMessage={props.emptyMessage}
        emptyContent={props.emptyContent}
        classNames={props.classNames}
      />
    </IconsProvider>
  )
}

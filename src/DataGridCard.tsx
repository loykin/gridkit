import type { DataGridCardProps } from '@/types'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'
import { useInfiniteScroll } from '@/core/hooks/useInfiniteScroll'
import { DataGridCardView } from '@/core/views/DataGridCardView'
import { IconsProvider } from '@/core/IconsContext'

export function DataGridCard<T extends object>(props: DataGridCardProps<T>) {
  const {
    error,
    headerLeft,
    headerRight,
    footer,
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
    containerHeight,
    tableHeight,
    maxTableHeight,
    minTableHeight,
    fillContainer,
    fillParent,
    enableVirtualization,
    estimateCardHeight,
    overscan,
    scrollbar,
  } = props

  const { wrapperRef, containerRef, table, rows, queryState } = useDataGridBase({
    ...props,
    pagination: undefined,
    columnSizingMode: 'fixed',
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

  if (effectiveError) {
    return <div className="dg-error">{effectiveError.message}</div>
  }

  return (
    <IconsProvider icons={icons}>
      <DataGridCardView
        wrapperRef={wrapperRef}
        containerRef={containerRef}
        table={table}
        rows={rows}
        headerLeft={headerLeft}
        headerRight={headerRight}
        footer={footer}
        loadMoreRef={loadMoreRef}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={effectiveIsLoading}
        renderCard={renderCard}
        cardColumns={cardColumns}
        minCardWidth={minCardWidth}
        minColumns={minColumns}
        containerHeight={containerHeight}
        tableHeight={tableHeight}
        maxTableHeight={maxTableHeight}
        minTableHeight={minTableHeight}
        fillContainer={fillContainer}
        fillParent={fillParent}
        enableVirtualization={enableVirtualization}
        estimateCardHeight={estimateCardHeight}
        overscan={overscan}
        scrollbar={scrollbar}
        onRowClick={props.onRowClick}
        rowCursor={props.rowCursor}
        emptyMessage={props.emptyMessage}
        emptyContent={props.emptyContent}
        classNames={props.classNames}
      />
    </IconsProvider>
  )
}

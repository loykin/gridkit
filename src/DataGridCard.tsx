import type { DataGridCardProps } from '@/types'
import { useGridKitView } from '@/core/view-sdk/useGridKitView'
import { useInfiniteScroll } from '@/core/hooks/useInfiniteScroll'
import { DataGridCardView } from '@/core/views/DataGridCardView'
import { IconsProvider } from '@/core/IconsContext'
import { LabelsProvider } from '@/core/LabelsContext'

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

  const { wrapperRef, containerRef, table, rows, queryState } = useGridKitView({
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

  return (
    <LabelsProvider labels={props.labels}>
      <IconsProvider icons={icons}>
        <DataGridCardView
          wrapperRef={wrapperRef}
          containerRef={containerRef}
          error={effectiveError}
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
          styles={props.styles}
        />
      </IconsProvider>
    </LabelsProvider>
  )
}

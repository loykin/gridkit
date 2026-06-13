import type { DataGridListProps } from '@/types'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'
import { useInfiniteScroll } from '@/core/hooks/useInfiniteScroll'
import { useRowVirtualizer } from '@/core/hooks/useRowVirtualizer'
import { DataGridListView } from '@/core/views/DataGridListView'
import { IconsProvider } from '@/core/IconsContext'

export function DataGridList<T extends object>(props: DataGridListProps<T>) {
  const {
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin = '100px',
    isLoading,
    icons,
    renderItem,
    itemKey,
    itemGap,
    itemPadding,
    containerHeight,
    tableHeight,
    maxTableHeight,
    minTableHeight,
    fillContainer,
    fillParent,
    enableVirtualization,
    estimateRowHeight = 48,
    overscan,
    headerLeft,
    headerRight,
    footer,
    classNames,
    scrollbar,
  } = props

  const { wrapperRef, containerRef, table, rows, queryState } = useDataGridBase({
    ...props,
    pagination: undefined,
    enableColumnResizing: false,
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

  const { virtual, virtualizer } = useRowVirtualizer({
    count: rows.length,
    containerRef,
    containerHeight: containerHeight ?? tableHeight,
    estimateSize: estimateRowHeight,
    overscan,
    enabled: enableVirtualization,
    fillMode: fillContainer || fillParent,
  })
  const effectiveContainerHeight = containerHeight ?? tableHeight
  const virtualInitialHeight =
    typeof effectiveContainerHeight === 'number' ? effectiveContainerHeight : undefined

  return (
    <IconsProvider icons={icons}>
      <DataGridListView
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
        renderItem={renderItem}
        itemKey={itemKey}
        itemGap={itemGap}
        itemPadding={itemPadding}
        containerHeight={containerHeight}
        tableHeight={tableHeight}
        maxTableHeight={maxTableHeight}
        minTableHeight={minTableHeight}
        fillContainer={fillContainer}
        fillParent={fillParent}
        virtual={virtual}
        rowVirtualizer={virtual ? virtualizer : undefined}
        virtualEstimateSize={estimateRowHeight}
        virtualInitialHeight={virtualInitialHeight}
        virtualOverscan={overscan}
        scrollbar={scrollbar}
        onRowClick={props.onRowClick}
        rowCursor={props.rowCursor}
        emptyMessage={props.emptyMessage}
        emptyContent={props.emptyContent}
        classNames={classNames}
        styles={props.styles}
      />
    </IconsProvider>
  )
}

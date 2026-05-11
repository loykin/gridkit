import type { DataGridListProps } from '@/types'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'
import { useInfiniteScroll } from '@/core/hooks/useInfiniteScroll'
import { useRowVirtualizer } from '@/core/hooks/useRowVirtualizer'
import { DataGridListView } from '@/core/DataGridListView'
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
    enableVirtualization,
    estimateRowHeight = 48,
    overscan,
    headerLeft,
    headerRight,
    footer,
    classNames,
  } = props

  const { wrapperRef, containerRef, table, rows } = useDataGridBase({
    ...props,
    pagination: undefined,
    enableColumnResizing: false,
    columnSizingMode: 'fixed',
  })

  const { loadMoreRef } = useInfiniteScroll({
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin,
    enabled: !isLoading,
  })

  const { virtual, virtualizer } = useRowVirtualizer({
    count: rows.length,
    containerRef,
    containerHeight: containerHeight ?? tableHeight,
    estimateSize: estimateRowHeight,
    overscan,
    enabled: enableVirtualization,
  })
  const effectiveContainerHeight = containerHeight ?? tableHeight
  const virtualInitialHeight =
    typeof effectiveContainerHeight === 'number' ? effectiveContainerHeight : undefined

  if (error) {
    return <div className="dg-error">{error.message}</div>
  }

  return (
    <IconsProvider icons={icons}>
      <DataGridListView
        wrapperRef={wrapperRef}
        containerRef={containerRef}
        table={table}
        rows={rows}
        headerLeft={headerLeft}
        headerRight={headerRight}
        footer={footer}
        loadMoreRef={loadMoreRef}
        isFetchingNextPage={isFetchingNextPage}
        isLoading={isLoading}
        renderItem={renderItem}
        itemKey={itemKey}
        itemGap={itemGap}
        itemPadding={itemPadding}
        containerHeight={containerHeight}
        tableHeight={tableHeight}
        virtual={virtual}
        rowVirtualizer={virtual ? virtualizer : undefined}
        virtualEstimateSize={estimateRowHeight}
        virtualInitialHeight={virtualInitialHeight}
        virtualOverscan={overscan}
        onRowClick={props.onRowClick}
        rowCursor={props.rowCursor}
        emptyMessage={props.emptyMessage}
        emptyContent={props.emptyContent}
        classNames={classNames}
      />
    </IconsProvider>
  )
}

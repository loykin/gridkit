import type { DataGridListProps } from '@/types'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'
import { useInfiniteScroll } from '@/core/hooks/useInfiniteScroll'
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
        leftFilters={props.leftFilters}
        rightFilters={props.rightFilters}
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
        onRowClick={props.onRowClick}
        rowCursor={props.rowCursor}
        emptyMessage={props.emptyMessage}
        emptyContent={props.emptyContent}
        classNames={classNames}
      />
    </IconsProvider>
  )
}

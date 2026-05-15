import { useEffect, useMemo } from 'react'
import type { DataGridChatProps } from '@/types'
import { useDataGridBase } from '@/core/hooks/useDataGridBase'
import { useReverseInfiniteScroll } from '@/core/hooks/useReverseInfiniteScroll'
import { useStickToBottom } from '@/core/hooks/useStickToBottom'
import { DataGridChatView } from '@/core/views/DataGridChatView'
import { IconsProvider } from '@/core/IconsContext'

export function DataGridChat<T extends object>(props: DataGridChatProps<T>) {
  const {
    error,
    hasPreviousPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
    rootMargin = '100px',
    isLoading,
    icons,
    renderMessage,
    renderDaySeparator,
    renderUnreadMarker,
    renderTypingIndicator,
    stickToBottom = true,
    bottomThreshold = 48,
    onAtBottomChange,
    containerHeight,
    tableHeight,
    headerLeft,
    headerRight,
    footer,
    classNames,
  } = props

  useEffect(() => {
    if (!props.getRowId && props.fetchPreviousPage) {
      console.warn(
        '[DataGridChat] getRowId is recommended when fetchPreviousPage is used. Index-based row IDs are unstable when older messages are prepended. Add getRowId={(message) => message.id}.',
      )
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { wrapperRef, containerRef, table, rows } = useDataGridBase({
    ...props,
    pagination: undefined,
    enableSorting: props.enableSorting ?? false,
    enableColumnResizing: false,
    columnSizingMode: 'fixed',
  })

  const rowSignature = useMemo(() => rows.map((row) => row.id).join('\n'), [rows])

  // renderTypingIndicator 유무가 바뀌면 컨테이너 높이가 변하므로 stick dependency에 포함한다.
  const stickDependency = useMemo(
    () => `${rowSignature}:${renderTypingIndicator != null ? 1 : 0}`,
    [rowSignature, renderTypingIndicator],
  )

  const { loadPreviousRef } = useReverseInfiniteScroll({
    containerRef,
    hasPreviousPage,
    isFetchingPreviousPage,
    fetchPreviousPage,
    rootMargin,
    enabled: !isLoading,
    dependency: rowSignature,
  })

  useStickToBottom({
    containerRef,
    enabled: stickToBottom && !isFetchingPreviousPage,
    threshold: bottomThreshold,
    dependency: stickDependency,
    onAtBottomChange,
  })

  if (error) {
    return <div className="dg-error">{error.message}</div>
  }

  return (
    <IconsProvider icons={icons}>
      <DataGridChatView
        wrapperRef={wrapperRef}
        containerRef={containerRef}
        table={table}
        rows={rows}
        headerLeft={headerLeft}
        headerRight={headerRight}
        footer={footer}
        loadPreviousRef={loadPreviousRef}
        isFetchingPreviousPage={isFetchingPreviousPage}
        isLoading={isLoading}
        renderMessage={renderMessage}
        renderDaySeparator={renderDaySeparator}
        renderUnreadMarker={renderUnreadMarker}
        renderTypingIndicator={renderTypingIndicator}
        containerHeight={containerHeight}
        tableHeight={tableHeight}
        emptyMessage={props.emptyMessage}
        emptyContent={props.emptyContent}
        classNames={classNames}
      />
    </IconsProvider>
  )
}

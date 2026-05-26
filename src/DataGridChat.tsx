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
    fillContainer,
    fillParent,
    headerLeft,
    headerRight,
    footer,
    scrollbar,
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

  const { wrapperRef, containerRef, table, rows, queryState } = useDataGridBase({
    ...props,
    pagination: undefined,
    enableSorting: props.enableSorting ?? false,
    enableColumnResizing: false,
    columnSizingMode: 'fixed',
  })
  const effectiveError = error ?? (props.queryMode === 'backend' ? queryState.error : null)
  const effectiveIsLoading = isLoading ?? (props.queryMode === 'backend' && (queryState.isHydrating || queryState.isQuerying))

  const rowSignature = useMemo(() => rows.map((row) => row.id).join('\n'), [rows])

  // Include renderTypingIndicator in the stick dependency since toggling it changes the container height.
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
    enabled: !effectiveIsLoading,
    dependency: rowSignature,
  })

  useStickToBottom({
    containerRef,
    enabled: stickToBottom && !isFetchingPreviousPage,
    threshold: bottomThreshold,
    dependency: stickDependency,
    onAtBottomChange,
  })

  if (effectiveError) {
    return <div className="dg-error">{effectiveError.message}</div>
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
        isLoading={effectiveIsLoading}
        renderMessage={renderMessage}
        renderDaySeparator={renderDaySeparator}
        renderUnreadMarker={renderUnreadMarker}
        renderTypingIndicator={renderTypingIndicator}
        containerHeight={containerHeight}
        tableHeight={tableHeight}
        fillContainer={fillContainer}
        fillParent={fillParent}
        scrollbar={scrollbar}
        emptyMessage={props.emptyMessage}
        emptyContent={props.emptyContent}
        classNames={classNames}
      />
    </IconsProvider>
  )
}

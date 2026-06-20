import type React from 'react'
import type { Row, Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { useIcons } from '@/core/IconsContext'
import { GridKitShell } from '@/core/GridKitShell'
import type { DataGridChatProps } from '@/types'

interface DataGridChatViewProps<T extends object>
  extends Pick<
    DataGridChatProps<T>,
    | 'isLoading'
    | 'emptyMessage'
    | 'emptyContent'
    | 'renderMessage'
    | 'renderDaySeparator'
    | 'renderUnreadMarker'
    | 'renderTypingIndicator'
    | 'isFetchingPreviousPage'
    | 'headerLeft'
    | 'headerRight'
    | 'footer'
    | 'containerHeight'
    | 'tableHeight'
    | 'maxTableHeight'
    | 'minTableHeight'
    | 'fillContainer'
    | 'fillParent'
    | 'openBottom'
    | 'scrollbar'
    | 'classNames'
    | 'styles'
  > {
  wrapperRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  table: Table<T>
  rows: Row<T>[]
  loadPreviousRef?: React.RefObject<HTMLDivElement | null>
  error?: Error | null
}

export function DataGridChatView<T extends object>({
  wrapperRef,
  containerRef,
  table,
  rows,
  loadPreviousRef,
  headerLeft,
  headerRight,
  footer,
  containerHeight,
  tableHeight,
  maxTableHeight,
  minTableHeight,
  fillContainer,
  fillParent,
  openBottom,
  scrollbar,
  isFetchingPreviousPage,
  isLoading,
  error,
  emptyMessage = 'No messages',
  emptyContent,
  renderMessage,
  renderDaySeparator,
  renderUnreadMarker,
  renderTypingIndicator,
  classNames,
  styles,
}: DataGridChatViewProps<T>) {
  const icons = useIcons()

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className={cn('gridkit-chat-messages', classNames?.loading)} style={styles?.loading}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="gridkit-chat-message-wrapper">
              <div className="gridkit-loading-pulse" />
            </div>
          ))}
        </div>
      )
    }

    if (rows.length === 0) {
      return (
        <div className={cn('gridkit-empty', classNames?.empty)} style={styles?.empty}>
          {emptyContent ?? emptyMessage}
        </div>
      )
    }

    return (
      <div className={cn('gridkit-chat-messages', classNames?.content)} style={styles?.content}>
        {rows.map((row, index) => {
          const previousRow = index > 0 ? rows[index - 1] : undefined
          const daySeparator = renderDaySeparator?.(row, previousRow)
          const unreadMarker = renderUnreadMarker?.(row)
          return (
            <div key={row.id} className="gridkit-chat-row">
              {daySeparator && (
                <div className={cn('gridkit-chat-day-separator', classNames?.daySeparator)} style={styles?.daySeparator}>
                  {daySeparator}
                </div>
              )}
              {unreadMarker && (
                <div className={cn('gridkit-chat-unread-marker', classNames?.unreadMarker)} style={styles?.unreadMarker}>
                  {unreadMarker}
                </div>
              )}
              <div className={cn('gridkit-chat-message-wrapper', classNames?.messageWrapper)} style={styles?.messageWrapper}>
                {renderMessage(row)}
              </div>
            </div>
          )
        })}
        {renderTypingIndicator && (
          <div className={cn('gridkit-chat-typing-indicator', classNames?.typingIndicator)} style={styles?.typingIndicator}>
            {renderTypingIndicator()}
          </div>
        )}
      </div>
    )
  }

  return (
    <GridKitShell
      wrapperRef={wrapperRef}
      containerRef={containerRef}
      table={table}
      headerLeft={headerLeft}
      headerRight={headerRight}
      containerHeight={containerHeight}
      tableHeight={tableHeight}
      maxTableHeight={maxTableHeight}
      minTableHeight={minTableHeight}
      fillContainer={fillContainer}
      fillParent={fillParent}
      openBottom={openBottom}
      frameView="chat"
      classNames={classNames}
      styles={styles}
      scrollbar={scrollbar}
      footer={footer}
    >
      {error
        ? <div className={cn('gridkit-error', classNames?.error)} style={styles?.error}>{error.message}</div>
        : null}
      {!error && loadPreviousRef && (
        <div
          ref={loadPreviousRef}
          className={cn('gridkit-chat-load-previous', classNames?.loadPrevious)}
          style={{ ...(isFetchingPreviousPage ? undefined : { padding: 0 }), ...styles?.loadPrevious }}
        >
          {isFetchingPreviousPage && icons.loading}
        </div>
      )}
      {!error && renderContent()}
    </GridKitShell>
  )
}

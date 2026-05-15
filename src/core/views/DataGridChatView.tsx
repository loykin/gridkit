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
    | 'classNames'
  > {
  wrapperRef: React.RefObject<HTMLDivElement | null>
  containerRef: React.RefObject<HTMLDivElement | null>
  table: Table<T>
  rows: Row<T>[]
  loadPreviousRef?: React.RefObject<HTMLDivElement | null>
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
  isFetchingPreviousPage,
  isLoading,
  emptyMessage = 'No messages',
  emptyContent,
  renderMessage,
  renderDaySeparator,
  renderUnreadMarker,
  renderTypingIndicator,
  classNames,
}: DataGridChatViewProps<T>) {
  const icons = useIcons()

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="dg-chat-messages">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="dg-chat-message-wrapper">
              <div className="dg-loading-pulse" />
            </div>
          ))}
        </div>
      )
    }

    if (rows.length === 0) {
      return (
        <div className={cn('dg-empty', classNames?.empty)}>
          {emptyContent ?? emptyMessage}
        </div>
      )
    }

    return (
      <div className="dg-chat-messages">
        {rows.map((row, index) => {
          const previousRow = index > 0 ? rows[index - 1] : undefined
          const daySeparator = renderDaySeparator?.(row, previousRow)
          const unreadMarker = renderUnreadMarker?.(row)
          return (
            <div key={row.id} className="dg-chat-row">
              {daySeparator && (
                <div className={cn('dg-chat-day-separator', classNames?.daySeparator)}>
                  {daySeparator}
                </div>
              )}
              {unreadMarker && (
                <div className={cn('dg-chat-unread-marker', classNames?.unreadMarker)}>
                  {unreadMarker}
                </div>
              )}
              <div className={cn('dg-chat-message-wrapper', classNames?.messageWrapper)}>
                {renderMessage(row)}
              </div>
            </div>
          )
        })}
        {renderTypingIndicator && (
          <div className={cn('dg-chat-typing-indicator', classNames?.typingIndicator)}>
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
      containerClassName={cn('dg-chat-container', classNames?.container)}
      footer={footer}
    >
      {loadPreviousRef && (
        <div
          ref={loadPreviousRef}
          className={cn('dg-chat-load-previous', classNames?.loadPrevious)}
          style={isFetchingPreviousPage ? undefined : { padding: 0 }}
        >
          {isFetchingPreviousPage && icons.loading}
        </div>
      )}
      {renderContent()}
    </GridKitShell>
  )
}

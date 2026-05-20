import React, { useContext } from 'react'
import type { Column, Row, Table } from '@tanstack/react-table'
import type { Virtualizer } from '@tanstack/react-virtual'
import { cn } from '@/lib/utils'
import { useIcons } from '@/core/IconsContext'
import type { DataGridClassNames, TableViewConfig, TableWidthMode } from '@/types'
import { RowWrapperContext } from '@/features/reordering/RowWrapperContext'
import { useDetailRow } from '@/features/expanding/DetailRowContext'
import { colStyle } from './tableUtils'
import { DataGridBodyRow } from './DataGridBodyRow'

interface DataGridBodyProps<T extends object>
  extends Pick<
    TableViewConfig<T>,
    'isLoading' | 'emptyMessage' | 'emptyContent' | 'onRowClick' | 'rowCursor' | 'bordered' | 'rowHeight' | 'renderDetailRow' | 'renderGroupRow'
  > {
  rows: Row<T>[]
  table: Table<T>
  visibleLeafColumns: Column<T>[]
  rowVirtualizer?: Virtualizer<HTMLDivElement, Element>
  onActionTrigger?: (row: T, el: HTMLElement) => void
  tableWidthMode?: TableWidthMode
  pinning?: boolean
  measureRows?: boolean
  classNames?: DataGridClassNames
}

export function DataGridBody<T extends object>({
  rows,
  table,
  visibleLeafColumns,
  rowVirtualizer,
  isLoading,
  emptyMessage,
  emptyContent,
  onRowClick,
  rowCursor,
  bordered,
  rowHeight,
  onActionTrigger,
  tableWidthMode = 'spacer',
  pinning = true,
  measureRows = true,
  renderDetailRow,
  renderGroupRow,
  classNames,
}: DataGridBodyProps<T>) {
  const showSpacer = tableWidthMode === 'spacer'
  const fillLast = tableWidthMode === 'fill-last'
  const RowWrapper = useContext(RowWrapperContext)
  const virtual = !!rowVirtualizer
  const detailRowCtx = useDetailRow()
  const icons = useIcons()
  const visibleColumnIds = React.useMemo(
    () => new Set(visibleLeafColumns.map((column) => column.id)),
    [visibleLeafColumns],
  )

  if (isLoading) {
    return (
      <div role="rowgroup" style={{ display: 'block' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            role="row"
            key={i}
            className="dg-row"
            data-last={i === 5 ? 'true' : undefined}
            style={{ minHeight: rowHeight }}
          >
            {visibleLeafColumns.map((col, colIdx) => {
              const isLast = colIdx === visibleLeafColumns.length - 1
              const isFillCell = fillLast && isLast && !col.getIsPinned()
              return (
                <div
                  role="gridcell"
                  key={col.id}
                  data-col-id={col.id}
                  className={cn('dg-loading-cell', bordered && !isLast && 'dg-loading-cell--bordered')}
                  style={{
                    ...colStyle(col, { pinning }),
                    ...(isFillCell && { flex: 1, width: 'auto' }),
                  }}
                >
                  <div className="dg-loading-pulse" />
                </div>
              )
            })}
            {showSpacer && <div role="gridcell" style={{ flex: 1, minWidth: 0, padding: 0 }} />}
          </div>
        ))}
      </div>
    )
  }

  if (rows.length === 0) {
    return (
      <div role="rowgroup" style={{ display: 'block' }}>
        <div role="row" className="dg-empty-row">
          <div role="gridcell" className="dg-empty-cell">
            <div className={cn('dg-empty', classNames?.empty)}>{emptyContent ?? emptyMessage}</div>
          </div>
        </div>
      </div>
    )
  }

  const virtualItems = rowVirtualizer?.getVirtualItems() ?? []
  const totalSize = rowVirtualizer?.getTotalSize() ?? 0

  const rowgroupStyle: React.CSSProperties = virtual
    ? { display: 'block', height: totalSize, position: 'relative' }
    : { display: 'block' }

  const rowEntries = virtual
    ? virtualItems.map((vRow) => ({
        row: rows[vRow.index]!,
        index: vRow.index,
        rowStyle: {
          position: 'absolute' as const,
          width: '100%',
          transform: `translateY(${vRow.start}px)`,
        },
        dataIndex: vRow.index,
        measureRef: measureRows ? rowVirtualizer!.measureElement : undefined,
      }))
    : rows.map((row, index) => ({
        row,
        index,
        rowStyle: undefined as React.CSSProperties | undefined,
        dataIndex: undefined as number | undefined,
        measureRef: undefined as ((node: Element | null) => void) | undefined,
      }))

  const renderGroupRowLabel = (row: Row<T>) =>
    renderGroupRow ? renderGroupRow(row) : (
      <>
        <span className="dg-group-label">{String(row.groupingValue ?? '')}</span>
        <span className="dg-group-count">({row.subRows.length})</span>
      </>
    )

  return (
    <>
      <div role="rowgroup" style={rowgroupStyle}>
        {rowEntries.map(({ row, index, rowStyle, dataIndex, measureRef }) => {
          if (row.getIsGrouped()) {
            return (
              <div
                key={row.id}
                role="row"
                className="dg-group-row"
                data-depth={row.depth}
                style={rowStyle}
                ref={measureRef ? (el) => measureRef(el) : undefined}
                data-index={dataIndex}
              >
                <div role="gridcell" className="dg-group-cell">
                  <button
                    className="dg-group-toggle"
                    onClick={row.getToggleExpandedHandler()}
                    aria-expanded={row.getIsExpanded()}
                    aria-label={row.getIsExpanded() ? 'Collapse group' : 'Expand group'}
                  >
                    {row.getIsExpanded() ? icons.treeCollapse : icons.treeExpand}
                  </button>
                  {renderGroupRowLabel(row)}
                </div>
                {showSpacer && <div role="gridcell" style={{ flex: 1, minWidth: 0, padding: 0 }} />}
              </div>
            )
          }

          const isDetailExpanded = renderDetailRow && detailRowCtx?.expandedRows.has(row.id)
          const detailPanel = isDetailExpanded ? (
            <div role="row" className="dg-detail-row">
              <div role="gridcell" style={{ width: '100%' }}>
                {renderDetailRow(row as Row<unknown>)}
              </div>
            </div>
          ) : null

          // Virtual mode: wrap row + optional detail panel so measureRef captures combined height
          if (virtual) {
            return (
              <div
                key={row.id}
                ref={measureRef}
                data-index={dataIndex}
                style={rowStyle}
              >
                <DataGridBodyRow
                  row={row}
                  table={table}
                  onRowClick={onRowClick}
                  rowCursor={rowCursor}
                  bordered={bordered}
                  rowHeight={rowHeight}
                  showSpacer={showSpacer}
                  fillLast={fillLast}
                  visibleColumnIds={visibleColumnIds}
                  pinning={pinning}
                  onActionTrigger={onActionTrigger}
                  isLastRow={index === rows.length - 1}
                  classNames={classNames}
                />
                {detailPanel}
              </div>
            )
          }

          const bodyRow = (
            <React.Fragment key={row.id}>
              <DataGridBodyRow
                row={row}
                table={table}
                onRowClick={onRowClick}
                rowCursor={rowCursor}
                bordered={bordered}
                rowHeight={rowHeight}
                showSpacer={showSpacer}
                fillLast={fillLast}
                visibleColumnIds={visibleColumnIds}
                pinning={pinning}
                onActionTrigger={onActionTrigger}
                isLastRow={index === rows.length - 1}
                classNames={classNames}
              />
              {detailPanel}
            </React.Fragment>
          )

          if (RowWrapper) {
            return (
              <RowWrapper key={row.id} row={row}>
                {bodyRow}
              </RowWrapper>
            )
          }
          return bodyRow
        })}
      </div>
      {/* Fill row: expands into remaining space when rows don't fill tableHeight.
          gradient is invisible at height=0 (rows overflow), preventing double border. */}
      {!virtual && (
        <div
          className="dg-fill-row"
          style={{
            background:
              'linear-gradient(to bottom, var(--dg-border) 0px, var(--dg-border) 1px, transparent 1px)',
          }}
        >
          {visibleLeafColumns.map((col, colIdx) => {
            const isLast = colIdx === visibleLeafColumns.length - 1
            const isFillCell = fillLast && isLast && !col.getIsPinned()
            return (
              <div
                key={col.id}
                className={cn(bordered && !isLast && 'dg-fill-cell--bordered')}
                style={{
                  ...colStyle(col, { pinning }),
                  ...(isFillCell && { flex: 1, width: 'auto' }),
                }}
              />
            )
          })}
          {showSpacer && <div style={{ flex: 1, minWidth: 0 }} />}
        </div>
      )}
    </>
  )
}

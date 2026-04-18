import { flexRender, type HeaderGroup, type Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { useIcons } from '@/core/IconsContext'
import type { DataGridClassNames, TableViewConfig, TableWidthMode } from '@/types'
import { colStyle, isPinnedEdge } from './tableUtils'
import { HeaderFilterPopover } from '@/core/filters/HeaderFilterPopover'

interface DataGridHeaderRowProps<T extends object>
  extends Pick<
    TableViewConfig<T>,
    'enableColumnResizing' | 'bordered' | 'enableColumnFilters' | 'filterDisplay'
  > {
  headerGroup: HeaderGroup<T>
  table: Table<T>
  virtual: boolean
  tableWidthMode?: TableWidthMode
  classNames?: DataGridClassNames
}

export function DataGridHeaderRow<T extends object>({
  headerGroup,
  table,
  enableColumnResizing,
  virtual,
  bordered,
  tableWidthMode = 'spacer',
  enableColumnFilters,
  filterDisplay = 'row',
  classNames,
}: DataGridHeaderRowProps<T>) {
  const icons = useIcons()
  const headers = headerGroup.headers
  return (
    <div
      role="row"
      className={cn('dg-header-row')}
      style={{ width: '100%', height: '36px' }}
    >
      {headers.map((header, idx) => {
        const edge = isPinnedEdge(header.column, table)
        const isLast = idx === headers.length - 1
        const isFillLast = tableWidthMode === 'fill-last' && isLast
        return (
          <div
            role="columnheader"
            key={header.id}
            data-col-id={header.column.id}
            data-sortable={header.column.getCanSort() ? 'true' : undefined}
            data-pinned={edge === 'left-edge' ? 'left' : edge === 'right-edge' ? 'right' : undefined}
            data-bordered={bordered ? 'true' : undefined}
            className={cn(
              'dg-header-cell',
              classNames?.headerCell,
            )}
            style={
              virtual
                ? {
                    display: 'flex',
                    alignItems: 'center',
                    width: isFillLast ? undefined : header.getSize(),
                    ...(isFillLast && { flex: 1, minWidth: header.getSize() }),
                  }
                : {
                    ...colStyle(header.column),
                    display: 'flex',
                    alignItems: 'center',
                    overflow: 'hidden',
                    ...(isFillLast && { flex: 1, width: 'auto' }),
                  }
            }
            onClick={
              header.column.getCanSort() ? header.column.getToggleSortingHandler() : undefined
            }
          >
            <span className="dg-header-cell-content">
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {header.isPlaceholder
                  ? null
                  : flexRender(header.column.columnDef.header, header.getContext())}
              </span>
              {header.column.getCanSort() && (
                <span className="dg-sort-icon">
                  {header.column.getIsSorted() === 'asc'
                    ? icons.sortAsc
                    : header.column.getIsSorted() === 'desc'
                      ? icons.sortDesc
                      : icons.sortNone}
                </span>
              )}
            </span>

            {enableColumnFilters && filterDisplay === 'icon' && (
              <HeaderFilterPopover col={header.column} table={table} />
            )}

            {enableColumnResizing && header.column.getCanResize() && (
              <div
                onMouseDown={(e) => {
                  e.stopPropagation()
                  header.getResizeHandler()(e)
                }}
                onTouchStart={(e) => {
                  e.stopPropagation()
                  header.getResizeHandler()(e)
                }}
                onClick={(e) => e.stopPropagation()}
                className="dg-resize-handle"
              >
                <div
                  data-resizing={header.column.getIsResizing() ? 'true' : undefined}
                  className="dg-resize-bar"
                />
              </div>
            )}
          </div>
        )
      })}
      {!virtual && tableWidthMode === 'spacer' && (
        <div
          role="columnheader"
          style={{ flex: 1, minWidth: 0, padding: 0 }}
        />
      )}
    </div>
  )
}

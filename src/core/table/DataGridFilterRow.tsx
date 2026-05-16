import type { CSSProperties } from 'react'
import type { Column, Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useIcons } from '@/core/IconsContext'
import { Input } from '@/components/ui/input'
import type { TableViewConfig, TableWidthMode } from '@/types'
import { colStyle } from './tableUtils'
import { SelectFilterCell } from '@/features/filters/components/SelectFilterCell'
import { MultiSelectFilterCell } from '@/features/filters/components/MultiSelectFilterCell'
import { NumberFilterPopover } from '@/features/filters/components/NumberFilterPopover'
import { DateFilterContent } from '@/features/filters/components/DateFilterContent'

interface DataGridFilterRowProps<T extends object> extends Pick<TableViewConfig<T>, 'bordered' | 'customFilterComponents'> {
  visibleLeafColumns: Column<T>[]
  table: Table<T>
  virtual: boolean
  tableWidthMode?: TableWidthMode
}

export function DataGridFilterRow<T extends object>({
  visibleLeafColumns,
  table,
  virtual,
  bordered,
  tableWidthMode = 'spacer',
  customFilterComponents,
}: DataGridFilterRowProps<T>) {
  const icons = useIcons()
  return (
    <div
      role="row"
      className={cn('dg-filter-row')}
      style={{ width: '100%', height: '36px' }}
    >
      {visibleLeafColumns.map((col) => {
        const ft = col.columnDef.meta?.filterType
        const CustomFilter = ft ? customFilterComponents?.[ft] : undefined
        const filterValue = (col.getFilterValue() ?? '') as string
        const cellStyle: CSSProperties = virtual
          ? { display: 'flex', alignItems: 'center', width: col.getSize() }
          : { ...colStyle(col), display: 'flex', alignItems: 'center' }

        if (ft === false) {
          return (
            <div
              role="columnheader"
              key={col.id}
              className={cn(
                'dg-filter-cell',
                bordered && 'dg-filter-cell--bordered',
              )}
              style={cellStyle}
            />
          )
        }

        return (
          <div
            role="columnheader"
            key={col.id}
            className={cn(
              'dg-filter-cell',
              bordered && 'dg-filter-cell--bordered',
            )}
            style={cellStyle}
          >
            {CustomFilter ? (
              <CustomFilter
                column={col}
                table={table}
                value={col.getFilterValue()}
                onChange={(value) => col.setFilterValue(value)}
              />
            ) : ft === 'select' ? (
              <SelectFilterCell col={col} table={table} />
            ) : ft === 'multi-select' ? (
              <MultiSelectFilterCell col={col} table={table} />
            ) : ft === 'number' ? (
              <NumberFilterPopover col={col} />
            ) : ft === 'date' || ft === 'date-range' || ft === 'datetime' || ft === 'datetime-range' ? (
              <DateFilterContent col={col} mode={ft} />
            ) : (
              <div style={{ position: 'relative', width: '100%' }}>
                <Input
                  type="text"
                  placeholder="Filter…"
                  value={filterValue}
                  onChange={(e) => col.setFilterValue(e.target.value || undefined)}
                  style={{ paddingRight: 24 }}
                />
                {filterValue && (
                  <Button
                    aria-label={`Clear ${col.id} filter`}
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => col.setFilterValue(undefined)}
                    style={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)' }}
                  >
                    {icons.clearFilter}
                  </Button>
                )}
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

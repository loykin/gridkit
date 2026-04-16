import React from 'react'
import type { Column, Table } from '@tanstack/react-table'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { TableViewConfig, TableWidthMode } from '@/types'
import { colStyle } from './tableUtils'
import { SelectFilterCell } from '@/core/filters/SelectFilterCell'
import { MultiSelectFilterCell } from '@/core/filters/MultiSelectFilterCell'
import { NumberFilterPopover } from '@/core/filters/NumberFilterPopover'

interface DataGridFilterRowProps<T extends object> extends Pick<TableViewConfig<T>, 'bordered'> {
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
}: DataGridFilterRowProps<T>) {
  return (
    <div
      role="row"
      className="border-b border-border bg-muted"
      style={{ display: 'flex', width: '100%', height: '36px' }}
    >
      {visibleLeafColumns.map((col) => {
        const ft = col.columnDef.meta?.filterType
        const filterValue = (col.getFilterValue() ?? '') as string
        const cellStyle: React.CSSProperties = virtual
          ? { display: 'flex', alignItems: 'center', width: col.getSize() }
          : { ...colStyle(col), display: 'flex', alignItems: 'center' }

        if (ft === false) {
          return (
            <div
              role="columnheader"
              key={col.id}
              className={cn('px-2 py-1', bordered && 'border-r border-border')}
              style={cellStyle}
            />
          )
        }

        return (
          <div
            role="columnheader"
            key={col.id}
            className={cn('px-2 py-1 font-normal', bordered && 'border-r border-border')}
            style={cellStyle}
          >
            {ft === 'select' ? (
              <SelectFilterCell col={col} table={table} />
            ) : ft === 'multi-select' ? (
              <MultiSelectFilterCell col={col} table={table} />
            ) : ft === 'number' ? (
              <NumberFilterPopover col={col} />
            ) : (
              <div className="relative w-full">
                <Input
                  type="text"
                  placeholder="Filter…"
                  value={filterValue}
                  onChange={(e) => col.setFilterValue(e.target.value || undefined)}
                  className="h-7 text-xs pr-6"
                />
                {filterValue && (
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => col.setFilterValue(undefined)}
                    className="absolute right-0.5 top-1/2 -translate-y-1/2"
                  >
                    <X />
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
          className="bg-muted"
        />
      )}
    </div>
  )
}

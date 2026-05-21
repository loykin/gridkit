import { useCallback, useState } from 'react'
import type { Column, Table } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useIcons } from '@/core/IconsContext'
import { SelectFilterCell } from '@/features/filters/components/SelectFilterCell'
import { MultiSelectContent } from '@/features/filters/components/MultiSelectContent'
import { NumberRangeFilterContent } from '@/features/filters/components/NumberRangeFilterContent'
import { DateFilterContent } from '@/features/filters/components/DateFilterContent'
import type { ColumnMenuContext, CustomFilterComponents, TableViewConfig } from '@/types'

interface ColumnMenuButtonProps<T extends object> {
  col: Column<T>
  table: Table<T>
  enableColumnFilters?: boolean
  enableColumnPinning?: boolean
  customFilterComponents?: CustomFilterComponents<T>
  renderColumnMenu?: TableViewConfig<T>['renderColumnMenu']
}

export function ColumnMenuButton<T extends object>({
  col,
  table,
  enableColumnFilters,
  enableColumnPinning,
  customFilterComponents,
  renderColumnMenu,
}: ColumnMenuButtonProps<T>) {
  const [open, setOpen] = useState(false)
  const icons = useIcons()
  const close = () => setOpen(false)
  const focusRef = useCallback((el: HTMLInputElement | null) => {
    el?.focus({ preventScroll: true })
  }, [])

  if (col.columnDef.meta?.columnMenu === false) return null

  const canSort = col.getCanSort()
  const sorted = col.getIsSorted()
  const pinned = col.getIsPinned()
  const ft = col.columnDef.meta?.filterType
  const canFilter = !!(enableColumnFilters && ft !== false)
  const canPin = !!(enableColumnPinning && col.getCanPin())
  const isActive = sorted !== false || col.getIsFiltered() || !!pinned

  const ctx: ColumnMenuContext = { canSort, canFilter, canPin }

  if (!canSort && !canFilter && !canPin && !renderColumnMenu) return null

  const renderFilterContent = () => {
    if (!canFilter) return null
    const filterValue = (col.getFilterValue() ?? '') as string
    const CustomFilter = ft && customFilterComponents?.[ft]
    if (CustomFilter) {
      return (
        <CustomFilter
          column={col}
          table={table}
          value={col.getFilterValue()}
          onChange={(value) => col.setFilterValue(value)}
          close={close}
          backend={col.columnDef.meta?.backend}
        />
      )
    }
    if (ft === 'select') return <SelectFilterCell col={col} table={table} onSelect={close} />
    if (ft === 'multi-select') return <MultiSelectContent col={col} table={table} />
    if (ft === 'number') return <NumberRangeFilterContent col={col} />
    if (ft === 'date' || ft === 'date-range' || ft === 'datetime' || ft === 'datetime-range') {
      return <DateFilterContent col={col} mode={ft} />
    }
    return (
      <div style={{ position: 'relative' }}>
        <Input
          type="text"
          placeholder="Filter…"
          value={filterValue}
          onChange={(e) => col.setFilterValue(e.target.value || undefined)}
          style={{ paddingRight: filterValue ? 28 : undefined }}
          ref={focusRef}
        />
        {filterValue && (
          <Button
            aria-label="Clear filter"
            variant="ghost"
            size="icon-xs"
            onClick={() => col.setFilterValue(undefined)}
            style={{ position: 'absolute', right: 2, top: '50%', transform: 'translateY(-50%)' }}
          >
            {icons.clearFilter}
          </Button>
        )}
      </div>
    )
  }

  const renderDefaultContent = () => (
    <>
      {canSort && (
        <>
          <div className="dg-col-menu-section">Sort</div>
          <button
            className="dg-popover-option"
            data-active={sorted === 'asc' ? 'true' : undefined}
            onClick={() => { col.toggleSorting(false); close() }}
          >
            {icons.sortAsc}
            <span>Sort Ascending</span>
          </button>
          <button
            className="dg-popover-option"
            data-active={sorted === 'desc' ? 'true' : undefined}
            onClick={() => { col.toggleSorting(true); close() }}
          >
            {icons.sortDesc}
            <span>Sort Descending</span>
          </button>
          {sorted && (
            <button className="dg-popover-option" onClick={() => { col.clearSorting(); close() }}>
              {icons.clearFilter}
              <span>Clear Sort</span>
            </button>
          )}
        </>
      )}

      {canFilter && (
        <>
          {canSort && <div className="dg-col-menu-divider" />}
          <div className="dg-col-menu-section">Filter</div>
          <div className="dg-col-menu-filter">
            {renderFilterContent()}
          </div>
        </>
      )}

      {canPin && (
        <>
          {(canSort || canFilter) && <div className="dg-col-menu-divider" />}
          <div className="dg-col-menu-section">Pin</div>
          <button
            className="dg-popover-option"
            data-active={pinned === 'left' ? 'true' : undefined}
            onClick={() => { col.pin('left'); close() }}
          >
            {icons.pinLeft}
            <span>Pin Left</span>
          </button>
          <button
            className="dg-popover-option"
            data-active={pinned === 'right' ? 'true' : undefined}
            onClick={() => { col.pin('right'); close() }}
          >
            {icons.pinRight}
            <span>Pin Right</span>
          </button>
          {pinned && (
            <button className="dg-popover-option" onClick={() => { col.pin(false); close() }}>
              {icons.pinOff}
              <span>Unpin</span>
            </button>
          )}
        </>
      )}
    </>
  )

  return (
    <div onClick={(e) => e.stopPropagation()}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              aria-label={`Column menu for ${col.id}`}
              variant="ghost"
              size="icon-xs"
              className={isActive ? 'dg-btn--filter-active' : 'dg-btn--filter-inactive'}
            >
              {icons.columnMenu}
            </Button>
          )}
        />
        <PopoverContent className="dg-header-popover" side="bottom" align="start" style={{ width: 200, padding: '4px 0' }}>
          {renderColumnMenu ? renderColumnMenu(col, table, close, ctx) : renderDefaultContent()}
        </PopoverContent>
      </Popover>
    </div>
  )
}

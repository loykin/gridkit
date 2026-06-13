import React from 'react'
import type { HeaderGroup, Table } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import type {
  DataGridClassNames,
  HeaderGroupLayout,
  TableViewConfig,
} from '@/types'
import { DataGridHeaderLayout } from '@/core/table/DataGridHeaderLayout'
import { DataGridFilterRow } from '@/core/table/DataGridFilterRow'
import type { ColumnRegionModel, TableLayoutModel } from '@/core/table/layout/tableLayoutTypes'

interface TableHeaderRegionsProps<T extends object>
  extends Pick<
    TableViewConfig<T>,
    | 'enableColumnResizing'
    | 'enableColumnFilters'
    | 'customFilterComponents'
    | 'filterDisplay'
    | 'bordered'
    | 'enableColumnPinning'
    | 'enableColumnMenu'
    | 'renderColumnMenu'
  > {
  layout: TableLayoutModel<T>
  headerGroups: HeaderGroup<T>[]
  table: Table<T>
  showHeader: boolean
  virtual: boolean
  headerGroupLayout: HeaderGroupLayout
  classNames?: DataGridClassNames
  styles?: import('@/types').DataGridStyles
  headerScrollRef: React.RefObject<HTMLDivElement | null>
  onCenterWheel?: React.WheelEventHandler<HTMLDivElement>
}

export function TableHeaderRegions<T extends object>({
  layout,
  headerGroups,
  table,
  showHeader,
  enableColumnResizing,
  enableColumnFilters,
  customFilterComponents,
  filterDisplay,
  bordered,
  virtual,
  headerGroupLayout,
  enableColumnPinning,
  enableColumnMenu,
  renderColumnMenu,
  classNames,
  styles,
  headerScrollRef,
  onCenterWheel,
}: TableHeaderRegionsProps<T>) {
  if (!showHeader) return null

  const renderHeaderRegion = (region: ColumnRegionModel<T>) => {
    if (region.columns.length === 0) return null

    return (
      <DataGridHeaderLayout
        headerGroups={headerGroups}
        table={table}
        visibleLeafColumns={region.columns}
        enableColumnResizing={enableColumnResizing}
        enableColumnFilters={enableColumnFilters}
        customFilterComponents={customFilterComponents}
        filterDisplay={filterDisplay}
        virtual={virtual}
        bordered={bordered}
        tableWidthMode={region.tableWidthMode}
        headerGroupLayout={headerGroupLayout}
        enableColumnReordering={region.reorderEnabled}
        enableColumnPinning={enableColumnPinning}
        enableColumnMenu={enableColumnMenu}
        renderColumnMenu={renderColumnMenu}
        classNames={classNames}
      />
    )
  }

  const renderFilterRegion = (region: ColumnRegionModel<T>) => {
    if (region.columns.length === 0) return null

    return (
      <DataGridFilterRow
        visibleLeafColumns={region.columns}
        table={table}
        virtual={virtual}
        bordered={bordered}
        tableWidthMode={region.tableWidthMode}
        pinning={false}
        customFilterComponents={customFilterComponents}
      />
    )
  }

  const renderFilters = (region: ColumnRegionModel<T>) => (
    enableColumnFilters &&
    filterDisplay !== 'icon' &&
    !enableColumnMenu &&
    renderFilterRegion(region)
  )

  return (
    <div className={cn('gridkit-header', classNames?.header)} style={styles?.header}>
      <div className="gridkit-region-grid" style={{ gridTemplateColumns: layout.gridTemplateColumns }}>
        {layout.hasLeftRegion && (
          <div className="gridkit-region gridkit-region--left" style={{ width: layout.regions.left.width }}>
            {renderHeaderRegion(layout.regions.left)}
            {renderFilters(layout.regions.left)}
          </div>
        )}
        <div
          ref={headerScrollRef}
          className="gridkit-region gridkit-region--center"
          style={{ overflow: 'hidden' }}
          onWheel={onCenterWheel}
        >
          <div style={{ width: layout.centerWidth, minWidth: '100%' }}>
            {renderHeaderRegion(layout.regions.center)}
            {renderFilters(layout.regions.center)}
          </div>
        </div>
        {layout.hasRightRegion && (
          <div className="gridkit-region gridkit-region--right" style={{ width: layout.regions.right.width }}>
            {renderHeaderRegion(layout.regions.right)}
            {renderFilters(layout.regions.right)}
          </div>
        )}
      </div>
    </div>
  )
}

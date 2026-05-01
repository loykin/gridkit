import { useState } from 'react'
import { PaginationTab } from './tabs/PaginationTab'
import { InfinityTab } from './tabs/InfinityTab'
import { FixedHeightTab } from './tabs/FixedHeightTab'
import { LargeListTab } from './tabs/LargeListTab'
import { LiveUpdateTab } from './tabs/LiveUpdateTab'
import { PinningTab } from './tabs/PinningTab'
import { SelectionTab } from './tabs/SelectionTab'
import { BorderedTab } from './tabs/BorderedTab'
import { RowHeightTab } from './tabs/RowHeightTab'
import { TreeTab } from './tabs/TreeTab'
import { DragTab } from './tabs/DragTab'
import { FilterIconTab } from './tabs/FilterIconTab'
import { ToolbarTab } from './tabs/ToolbarTab'
import { DataStoreTab } from './tabs/DataStoreTab'
import { LogStreamTab } from './tabs/LogStreamTab'
import { BackendTab } from './tabs/BackendTab'
import { EmptyStateTab } from './tabs/EmptyStateTab'
import { IconsTab } from './tabs/IconsTab'
import { ColumnReorderTab } from './tabs/ColumnReorderTab'
import { MasterDetailTab } from './tabs/MasterDetailTab'
import { ColumnPinningTab } from './tabs/ColumnPinningTab'
import { InlineEditTab } from './tabs/InlineEditTab'
import { ExportTab } from './tabs/ExportTab'
import { THEMES, type Theme } from './themes'
import { PlaygroundContext } from './PlaygroundContext'

const TABS = [
  { id: 'pagination', label: 'Pagination', content: <PaginationTab /> },
  { id: 'infinity', label: 'Infinite Scroll', content: <InfinityTab /> },
  { id: 'fixed', label: 'Fixed Height', content: <FixedHeightTab /> },
  { id: 'large-list', label: 'Large List', content: <LargeListTab /> },
  { id: 'live-update', label: 'Live Update', content: <LiveUpdateTab /> },
  { id: 'pinning', label: 'Column Pinning', content: <PinningTab /> },
  { id: 'selection', label: 'Row Selection', content: <SelectionTab /> },
  { id: 'bordered', label: 'Bordered', content: <BorderedTab /> },
  { id: 'row-height', label: 'Row Height', content: <RowHeightTab /> },
  { id: 'tree', label: 'Tree / Groups', content: <TreeTab /> },
  { id: 'drag', label: 'Row Drag', content: <DragTab /> },
  { id: 'filter-icon', label: 'Filter Icon', content: <FilterIconTab /> },
  { id: 'toolbar', label: 'Toolbar', content: <ToolbarTab /> },
  { id: 'data-store', label: 'DataStore', content: <DataStoreTab /> },
  { id: 'log-stream', label: 'Log Stream', content: <LogStreamTab /> },
  { id: 'backend', label: 'Backend', content: <BackendTab /> },
  { id: 'empty-state', label: 'Empty State', content: <EmptyStateTab /> },
  { id: 'icons', label: 'Custom Icons', content: <IconsTab /> },
  { id: 'column-reorder', label: 'Column Reorder', content: <ColumnReorderTab /> },
  { id: 'master-detail', label: 'Master-Detail', content: <MasterDetailTab /> },
  { id: 'column-pinning', label: 'Column Pinning UI', content: <ColumnPinningTab /> },
  { id: 'inline-edit', label: 'Inline Edit', content: <InlineEditTab /> },
  { id: 'export', label: 'Export CSV', content: <ExportTab /> },
] as const

type TabId = (typeof TABS)[number]['id']

function ThemeSwatch({
  theme,
  active,
  onClick,
}: {
  theme: Theme
  active: boolean
  onClick: () => void
}) {
  const primary =
    theme.vars['--dg-primary'] ??
    (theme.dark ? 'oklch(0.424 0.199 265.638)' : 'oklch(0.488 0.243 264.376)')
  const bg = theme.vars['--dg-background'] ?? (theme.dark ? 'oklch(0.145 0 0)' : 'oklch(1 0 0)')
  return (
    <button
      onClick={onClick}
      title={theme.name}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded text-xs transition-colors ${
        active ? 'ring-2 ring-primary ring-offset-1' : 'hover:bg-muted'
      }`}
    >
      <span className="flex gap-0.5 shrink-0">
        <span className="w-3 h-3 rounded-sm border border-black/10" style={{ background: bg }} />
        <span className="w-3 h-3 rounded-sm" style={{ background: primary }} />
      </span>
      {theme.name}
    </button>
  )
}

const RADIUS_PRESETS = [
  { label: 'None', value: '0rem' },
  { label: 'SM', value: '0.25rem' },
  { label: 'MD', value: '0.375rem' },
  { label: 'LG', value: '0.5rem' },
  { label: 'XL', value: '0.75rem' },
] as const

type RadiusValue = (typeof RADIUS_PRESETS)[number]['value']

export default function App() {
  const [active, setActive] = useState<TabId>('pagination')
  const [theme, setTheme] = useState<Theme>(THEMES[0]!)
  const [radius, setRadius] = useState<RadiusValue>('0rem')
  const current = TABS.find((t) => t.id === active)!

  const themeStyle = {
    ...theme.vars,
    '--dg-radius': radius,
  } as React.CSSProperties

  return (
    <PlaygroundContext value={{ rounded: radius !== '0rem' }}>
      <div className={theme.dark ? 'dark' : ''} style={themeStyle}>
        <div className="min-h-screen bg-background text-foreground">
          {/* Header */}
          <div className="border-b border-border px-8 py-3 flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-xl font-semibold">DataGrid Playground</h1>
              <p className="text-xs text-muted-foreground mt-0.5">@loykin/gridkit</p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* Radius selector */}
              <div className="flex items-center gap-1">
                <span className="text-xs text-muted-foreground mr-1">Radius</span>
                {RADIUS_PRESETS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setRadius(p.value)}
                    className={`px-2 py-1 text-xs font-medium transition-colors border rounded ${
                      radius === p.value
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <div className="w-px h-5 bg-border" />

              {/* Theme swatches */}
              <div className="flex items-center gap-1 flex-wrap">
                {THEMES.map((t) => (
                  <ThemeSwatch
                    key={t.name}
                    theme={t}
                    active={t.name === theme.name}
                    onClick={() => setTheme(t)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tab bar */}
          <div className="border-b border-border px-8">
            <div className="flex gap-0 overflow-x-auto">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActive(tab.id)}
                  className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors ${
                    active === tab.id
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">{current.content}</div>
        </div>
      </div>
    </PlaygroundContext>
  )
}

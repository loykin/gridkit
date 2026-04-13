import { useState } from 'react'
import { PaginationTab } from './tabs/PaginationTab'
import { InfinityTab }   from './tabs/InfinityTab'
import { FixedHeightTab } from './tabs/FixedHeightTab'
import { LargeListTab }  from './tabs/LargeListTab'
import { LiveUpdateTab } from './tabs/LiveUpdateTab'
import { PinningTab }    from './tabs/PinningTab'
import { SelectionTab }  from './tabs/SelectionTab'
import { BorderedTab }   from './tabs/BorderedTab'
import { RowHeightTab } from './tabs/RowHeightTab'
import { TreeTab }     from './tabs/TreeTab'
import { DragTab }     from './tabs/DragTab'
import { FilterIconTab } from './tabs/FilterIconTab'
import { ToolbarTab }    from './tabs/ToolbarTab'

const TABS = [
  { id: 'pagination',  label: 'Pagination',      content: <PaginationTab /> },
  { id: 'infinity',    label: 'Infinite Scroll', content: <InfinityTab /> },
  { id: 'fixed',       label: 'Fixed Height',    content: <FixedHeightTab /> },
  { id: 'large-list',  label: 'Large List',      content: <LargeListTab /> },
  { id: 'live-update', label: 'Live Update',     content: <LiveUpdateTab /> },
  { id: 'pinning',     label: 'Column Pinning',  content: <PinningTab /> },
  { id: 'selection',   label: 'Row Selection',   content: <SelectionTab /> },
  { id: 'bordered',    label: 'Bordered',        content: <BorderedTab /> },
  { id: 'row-height',  label: 'Row Height',      content: <RowHeightTab /> },
  { id: 'tree',        label: 'Tree / Groups',   content: <TreeTab /> },
  { id: 'drag',        label: 'Row Drag',        content: <DragTab /> },
  { id: 'filter-icon', label: 'Filter Icon',     content: <FilterIconTab /> },
  { id: 'toolbar',     label: 'Toolbar',         content: <ToolbarTab /> },
] as const

type TabId = typeof TABS[number]['id']

export default function App() {
  const [active, setActive] = useState<TabId>('pagination')
  const current = TABS.find((t) => t.id === active)!

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="border-b border-border px-8 py-4">
        <h1 className="text-xl font-semibold">DataGrid Playground</h1>
        <p className="text-xs text-muted-foreground mt-0.5">@loykin/gridkit</p>
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
      <div className="px-8 py-6">
        {current.content}
      </div>
    </div>
  )
}

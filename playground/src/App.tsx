import { useEffect, useState } from 'react'
import { Navigate, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { PaginationTab } from './tabs/PaginationTab'
import { InfinityTab } from './tabs/InfinityTab'
import { FixedHeightTab } from './tabs/FixedHeightTab'
import { FillContainerTab } from './tabs/FillContainerTab'
import { FillParentTab } from './tabs/FillParentTab'
import { ViewsFillTab } from './tabs/ViewsFillTab'
import { LayoutModesTab } from './tabs/LayoutModesTab'
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
import { ThemeTokensTab } from './tabs/ThemeTokensTab'
import { ColumnReorderTab } from './tabs/ColumnReorderTab'
import { MasterDetailTab } from './tabs/MasterDetailTab'
import { ColumnPinningTab } from './tabs/ColumnPinningTab'
import { ColumnMenuTab } from './tabs/ColumnMenuTab'
import { InlineEditTab } from './tabs/InlineEditTab'
import { ExportTab } from './tabs/ExportTab'
import { CardTab } from './tabs/CardTab'
import { CardVirtualizationTab } from './tabs/CardVirtualizationTab'
import { CardListTab } from './tabs/CardListTab'
import { ListTab } from './tabs/ListTab'
import { ChatTab } from './tabs/ChatTab'
import { AgentChatTab } from './tabs/AgentChatTab'
import { AgentTraceTab } from './tabs/AgentTraceTab'
import { EvalReviewTab } from './tabs/EvalReviewTab'
import { HeaderGroupsTab } from './tabs/HeaderGroupsTab'
import { GroupingTab } from './tabs/GroupingTab'
import { StatePersistenceTab } from './tabs/StatePersistenceTab'
import { THEMES, type Theme } from './themes'
import { PlaygroundContext } from './PlaygroundContext'

// ── Tab registry ──────────────────────────────────────────────────────────────

const TABS = [
  { id: 'pagination',        label: 'Pagination',        content: <PaginationTab /> },
  { id: 'infinity',          label: 'Infinite Scroll',   content: <InfinityTab /> },
  { id: 'backend',           label: 'Backend',           content: <BackendTab /> },
  { id: 'data-store',        label: 'DataStore',         content: <DataStoreTab /> },
  { id: 'live-update',       label: 'Live Update',       content: <LiveUpdateTab /> },
  { id: 'state-persistence', label: 'State Persistence', content: <StatePersistenceTab /> },
  { id: 'fixed',             label: 'Fixed Height',      content: <FixedHeightTab /> },
  { id: 'layout-modes',      label: 'Layout Modes',      content: <LayoutModesTab /> },
  { id: 'fill-container',    label: 'Fill Container',    content: <FillContainerTab /> },
  { id: 'fill-parent',       label: 'Fill Parent',       content: <FillParentTab /> },
  { id: 'views-fill',        label: 'Views Fill',        content: <ViewsFillTab /> },
  { id: 'large-list',        label: 'Large List',        content: <LargeListTab /> },
  { id: 'pinning',           label: 'Column Pinning',    content: <PinningTab /> },
  { id: 'column-pinning',    label: 'Column Pinning UI', content: <ColumnPinningTab /> },
  { id: 'column-reorder',    label: 'Reorder',           content: <ColumnReorderTab /> },
  { id: 'column-menu',       label: 'Column Menu',       content: <ColumnMenuTab /> },
  { id: 'header-groups',     label: 'Header Groups',     content: <HeaderGroupsTab /> },
  { id: 'filter-icon',       label: 'Filter Icon',       content: <FilterIconTab /> },
  { id: 'selection',         label: 'Row Selection',     content: <SelectionTab /> },
  { id: 'row-height',        label: 'Row Height',        content: <RowHeightTab /> },
  { id: 'drag',              label: 'Row Drag',          content: <DragTab /> },
  { id: 'tree',              label: 'Tree / Groups',     content: <TreeTab /> },
  { id: 'grouping',          label: 'Row Grouping',      content: <GroupingTab /> },
  { id: 'master-detail',     label: 'Master-Detail',     content: <MasterDetailTab /> },
  { id: 'inline-edit',       label: 'Inline Edit',       content: <InlineEditTab /> },
  { id: 'export',            label: 'Export CSV',        content: <ExportTab /> },
  { id: 'bordered',          label: 'Bordered',          content: <BorderedTab /> },
  { id: 'empty-state',       label: 'Empty State',       content: <EmptyStateTab /> },
  { id: 'icons',             label: 'Custom Icons',      content: <IconsTab /> },
  { id: 'theme-tokens',      label: 'Theme Tokens',      content: <ThemeTokensTab /> },
  { id: 'toolbar',           label: 'Toolbar',           content: <ToolbarTab /> },
  { id: 'card',              label: 'Card Grid',         content: <CardTab /> },
  { id: 'card-virtual',      label: 'Card Virtualization', content: <CardVirtualizationTab /> },
  { id: 'card-list',         label: 'Card List',         content: <CardListTab /> },
  { id: 'list',              label: 'List',              content: <ListTab /> },
  { id: 'chat',              label: 'Chat',              content: <ChatTab /> },
  { id: 'agent-chat',        label: 'Agent Chat',        content: <AgentChatTab /> },
  { id: 'log-stream',        label: 'Log Stream',        content: <LogStreamTab /> },
  { id: 'agent-trace',       label: 'Agent Trace',       content: <AgentTraceTab /> },
  { id: 'eval-review',       label: 'Eval Review',       content: <EvalReviewTab /> },
] as const

type TabId = (typeof TABS)[number]['id']

// ── Sidebar nav groups ────────────────────────────────────────────────────────

interface NavItem { id: TabId; label: string }
interface NavGroup { label: string; items: NavItem[] }

const NAV: NavGroup[] = [
  {
    label: 'Data',
    items: [
      { id: 'pagination',        label: 'Pagination' },
      { id: 'infinity',          label: 'Infinite Scroll' },
      { id: 'backend',           label: 'Backend' },
      { id: 'data-store',        label: 'DataStore' },
      { id: 'live-update',       label: 'Live Update' },
      { id: 'state-persistence', label: 'State Persistence' },
    ],
  },
  {
    label: 'Layout',
    items: [
      { id: 'fixed',          label: 'Fixed Height' },
      { id: 'layout-modes',   label: 'Layout Modes' },
      { id: 'fill-container', label: 'Fill Container' },
      { id: 'fill-parent',    label: 'Fill Parent' },
      { id: 'views-fill',     label: 'Views Fill' },
      { id: 'large-list',     label: 'Large List' },
    ],
  },
  {
    label: 'Columns',
    items: [
      { id: 'pinning',        label: 'Column Pinning' },
      { id: 'column-pinning', label: 'Column Pinning UI' },
      { id: 'column-reorder', label: 'Reorder' },
      { id: 'column-menu',    label: 'Column Menu' },
      { id: 'header-groups',  label: 'Header Groups' },
      { id: 'filter-icon',    label: 'Filter Icon' },
    ],
  },
  {
    label: 'Rows',
    items: [
      { id: 'selection',     label: 'Row Selection' },
      { id: 'row-height',    label: 'Row Height' },
      { id: 'drag',          label: 'Row Drag' },
      { id: 'tree',          label: 'Tree / Groups' },
      { id: 'grouping',      label: 'Row Grouping' },
      { id: 'master-detail', label: 'Master-Detail' },
      { id: 'inline-edit',   label: 'Inline Edit' },
      { id: 'export',        label: 'Export CSV' },
    ],
  },
  {
    label: 'Appearance',
    items: [
      { id: 'bordered',     label: 'Bordered' },
      { id: 'empty-state',  label: 'Empty State' },
      { id: 'icons',        label: 'Custom Icons' },
      { id: 'theme-tokens', label: 'Theme Tokens' },
      { id: 'toolbar',      label: 'Toolbar' },
    ],
  },
  {
    label: 'Views',
    items: [
      { id: 'card',        label: 'Card Grid' },
      { id: 'card-virtual', label: 'Card Virtualization' },
      { id: 'card-list',   label: 'Card List' },
      { id: 'list',        label: 'List' },
      { id: 'log-stream',  label: 'Log Stream' },
      { id: 'agent-trace', label: 'Agent Trace' },
      { id: 'eval-review', label: 'Eval Review' },
    ],
  },
  {
    label: 'Chat',
    items: [
      { id: 'chat',       label: 'Chat' },
      { id: 'agent-chat', label: 'Agent Chat' },
    ],
  },
]

// ── Theme swatch ──────────────────────────────────────────────────────────────

function ThemeSwatch({ theme, active, onClick }: { theme: Theme; active: boolean; onClick: () => void }) {
  const primary = theme.vars['--dg-primary'] ?? (theme.dark ? 'oklch(0.424 0.199 265.638)' : 'oklch(0.488 0.243 264.376)')
  const bg = theme.vars['--dg-background'] ?? (theme.dark ? 'oklch(0.145 0 0)' : 'oklch(1 0 0)')
  return (
    <button
      onClick={onClick}
      title={theme.name}
      className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-colors ${
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
  { label: 'SM',   value: '0.25rem' },
  { label: 'MD',   value: '0.375rem' },
  { label: 'LG',   value: '0.5rem' },
  { label: 'XL',   value: '0.75rem' },
] as const

type RadiusValue = (typeof RADIUS_PRESETS)[number]['value']

// ── App ────────────────────────────────────────────────────────────────────────

function isTabId(id: string | undefined): id is TabId {
  return TABS.some((tab) => tab.id === id)
}

function PlaygroundApp() {
  const { tabId = 'pagination' } = useParams()
  const navigate = useNavigate()
  const routeTab = isTabId(tabId) ? tabId : 'pagination'
  const [active, setActiveState] = useState<TabId>(routeTab)

  const setActive = (id: TabId) => {
    setActiveState(id)
    navigate(`/${id}`)
  }

  useEffect(() => {
    setActiveState(routeTab)
  }, [routeTab])

  const [theme, setTheme] = useState<Theme>(THEMES[0]!)
  const [radius, setRadius] = useState<RadiusValue>('0rem')
  const current = TABS.find((t) => t.id === active)!

  const themeStyle = { ...theme.vars, '--dg-radius': radius } as React.CSSProperties

  return (
    <PlaygroundContext value={{ rounded: radius !== '0rem' }}>
      <div className={theme.dark ? 'dark' : ''} style={themeStyle}>
        <div className="flex h-screen bg-background text-foreground overflow-hidden">

          {/* Sidebar */}
          <aside className="w-52 shrink-0 border-r border-border flex flex-col overflow-hidden">
            {/* Logo */}
            <div className="px-4 py-4 border-b border-border shrink-0">
              <p className="text-sm font-semibold">DataGrid Playground</p>
              <p className="text-xs text-muted-foreground mt-0.5">@loykin/gridkit</p>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-y-auto py-3">
              {NAV.map((group) => (
                <div key={group.label} className="mb-4">
                  <p className="px-4 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </p>
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActive(item.id)}
                      className={`w-full text-left px-4 py-1.5 text-xs transition-colors ${
                        active === item.id
                          ? 'bg-accent text-accent-foreground font-medium'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              ))}
            </nav>

            {/* Theme controls */}
            <div className="shrink-0 border-t border-border px-3 py-3 flex flex-col gap-2">
              {/* Radius */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Radius
                </p>
                <div className="flex gap-1 flex-wrap">
                  {RADIUS_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setRadius(p.value)}
                      className={`px-1.5 py-0.5 text-[10px] font-medium border rounded transition-colors ${
                        radius === p.value
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Themes */}
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Theme
                </p>
                <div className="flex flex-col gap-0.5">
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
          </aside>

          {/* Main content */}
          <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
            <div className="px-6 py-2 border-b border-border shrink-0">
              <p className="text-sm font-medium">{current.label}</p>
            </div>
            <div className="flex-1 overflow-auto px-6 py-5">
              {current.content}
            </div>
          </div>

        </div>
      </div>
    </PlaygroundContext>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/:tabId" element={<PlaygroundApp />} />
      <Route path="/" element={<Navigate to="/pagination" replace />} />
      <Route path="*" element={<Navigate to="/pagination" replace />} />
    </Routes>
  )
}

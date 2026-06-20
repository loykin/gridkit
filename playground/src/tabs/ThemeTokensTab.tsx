import { useState } from 'react'
import type React from 'react'
import { DataGrid, DataGridCard, DataGridChat, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { SMALL_DATA, type Employee } from '../data/employees'

// ── Table preview ────────────────────────────────────────────────────────────

const tableColumns: DataGridColumnDef<Employee>[] = [
  {
    id: 'identity',
    header: 'Identity',
    columns: [
      { accessorKey: 'id', header: 'ID', meta: { flex: 0.55, filterType: 'number' } },
      { accessorKey: 'name', header: 'Name', meta: { flex: 1.6, filterType: 'text' } },
    ],
  },
  {
    id: 'work',
    header: 'Work',
    columns: [
      { accessorKey: 'department', header: 'Department', meta: { flex: 1.2, filterType: 'select' } },
      { accessorKey: 'role', header: 'Role', meta: { flex: 1.2, filterType: 'select' } },
      { accessorKey: 'status', header: 'Status', meta: { flex: 0.9, filterType: 'select' } },
    ],
  },
  {
    id: 'metrics',
    header: 'Metrics',
    columns: [
      {
        accessorKey: 'salary',
        header: 'Salary',
        meta: { flex: 1, align: 'right', filterType: 'number' },
        cell: ({ getValue }) => `$${getValue<number>().toLocaleString()}`,
      },
      { accessorKey: 'score', header: 'Score', meta: { flex: 0.75, align: 'right', filterType: 'number' } },
    ],
  },
]

// ── Card preview ─────────────────────────────────────────────────────────────

const cardColumns: DataGridColumnDef<Employee>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'name' },
  { accessorKey: 'department' },
  { accessorKey: 'role' },
  { accessorKey: 'salary' },
  { accessorKey: 'status' },
]

const STATUS_COLOR: Record<Employee['status'], string> = {
  Active: 'bg-green-100 text-green-800',
  'On Leave': 'bg-yellow-100 text-yellow-800',
  Terminated: 'bg-red-100 text-red-800',
}

// ── Chat preview ──────────────────────────────────────────────────────────────

interface PreviewMessage {
  id: string
  author: string
  body: string
  mine: boolean
}

const PREVIEW_MESSAGES: PreviewMessage[] = [
  { id: '1', author: 'Alice', body: 'Hey, can you review this PR?', mine: false },
  { id: '2', author: 'Me', body: "Sure, I'll take a look now.", mine: true },
  { id: '3', author: 'Alice', body: 'It touches the auth flow, be careful.', mine: false },
  { id: '4', author: 'Me', body: 'Got it. Tests are passing locally.', mine: true },
  { id: '5', author: 'Alice', body: 'Great! The tests are in /auth/__tests__', mine: false },
  { id: '6', author: 'Me', body: 'Left a comment on line 42.', mine: true },
  { id: '7', author: 'Alice', body: 'Good catch, fixing it now.', mine: false },
  { id: '8', author: 'Me', body: 'Approved once that is resolved.', mine: true },
]

const chatColumns: DataGridColumnDef<PreviewMessage>[] = [
  { accessorKey: 'author' },
  { accessorKey: 'body' },
]

// ── Theme presets ─────────────────────────────────────────────────────────────

const presets = [
  {
    label: 'Default',
    values: {
      background: '#ffffff',
      foreground: '#0f172a',
      popover: '#ffffff',
      popoverForeground: '#0f172a',
      primary: '#2563eb',
      primaryForeground: '#ffffff',
      secondary: '#f1f5f9',
      secondaryForeground: '#0f172a',
      muted: '#f8fafc',
      mutedForeground: '#64748b',
      headerBackground: '#f8fafc',
      headerForeground: '#64748b',
      headerBorder: '#e2e8f0',
      headerControlBackground: '#f8fafc',
      headerControlForeground: '#64748b',
      headerControlBorder: '#e2e8f0',
      headerControlPlaceholder: '#94a3b8',
      headerPopoverBackground: '#f8fafc',
      headerPopoverForeground: '#64748b',
      headerPopoverBorder: '#e2e8f0',
      footerBackground: '#ffffff',
      footerForeground: '#64748b',
      footerBorder: '#e2e8f0',
      accent: '#f1f5f9',
      accentForeground: '#0f172a',
      destructive: '#dc2626',
      border: '#e2e8f0',
      containerBorder: '#e2e8f0',
      input: '#cbd5e1',
      controlBackground: '#ffffff',
      controlForeground: '#0f172a',
      controlBorder: '#cbd5e1',
      ring: '#2563eb',
      radius: '0rem',
    },
  },
  {
    label: 'Cool',
    values: {
      background: '#f8fbff',
      foreground: '#0f172a',
      popover: '#ffffff',
      popoverForeground: '#0f172a',
      primary: '#0284c7',
      primaryForeground: '#ffffff',
      secondary: '#e0f2fe',
      secondaryForeground: '#075985',
      muted: '#eff6ff',
      mutedForeground: '#475569',
      headerBackground: '#dbeafe',
      headerForeground: '#1e3a8a',
      headerBorder: '#bfdbfe',
      headerControlBackground: '#dbeafe',
      headerControlForeground: '#1e3a8a',
      headerControlBorder: '#bfdbfe',
      headerControlPlaceholder: '#3b82f6',
      headerPopoverBackground: '#dbeafe',
      headerPopoverForeground: '#1e3a8a',
      headerPopoverBorder: '#bfdbfe',
      footerBackground: '#f8fbff',
      footerForeground: '#475569',
      footerBorder: '#bfdbfe',
      accent: '#bae6fd',
      accentForeground: '#0c4a6e',
      destructive: '#dc2626',
      border: '#bfdbfe',
      containerBorder: '#bfdbfe',
      input: '#93c5fd',
      controlBackground: '#ffffff',
      controlForeground: '#0f172a',
      controlBorder: '#93c5fd',
      ring: '#0284c7',
      radius: '0.375rem',
    },
  },
  {
    label: 'Dark',
    values: {
      background: '#111827',
      foreground: '#f9fafb',
      popover: '#1f2937',
      popoverForeground: '#f9fafb',
      primary: '#60a5fa',
      primaryForeground: '#0f172a',
      secondary: '#1f2937',
      secondaryForeground: '#e5e7eb',
      muted: '#1f2937',
      mutedForeground: '#9ca3af',
      headerBackground: '#182235',
      headerForeground: '#cbd5e1',
      headerBorder: '#374151',
      headerControlBackground: '#182235',
      headerControlForeground: '#cbd5e1',
      headerControlBorder: '#374151',
      headerControlPlaceholder: '#94a3b8',
      headerPopoverBackground: '#182235',
      headerPopoverForeground: '#cbd5e1',
      headerPopoverBorder: '#374151',
      footerBackground: '#111827',
      footerForeground: '#9ca3af',
      footerBorder: '#374151',
      accent: '#374151',
      accentForeground: '#f9fafb',
      destructive: '#f87171',
      border: '#374151',
      containerBorder: '#374151',
      input: '#4b5563',
      controlBackground: '#1f2937',
      controlForeground: '#f9fafb',
      controlBorder: '#4b5563',
      ring: '#60a5fa',
      radius: '0.5rem',
    },
  },
] as const

type ThemeValues = (typeof presets)[number]['values']
type PreviewTab = 'table' | 'card' | 'chat'

function TokenInput({
  label,
  value,
  onChange,
}: {
  label: string
  value: string
  onChange: (value: string) => void
}) {
  return (
    <label className="grid grid-cols-[1fr_44px] items-center gap-2 text-xs text-muted-foreground">
      <span>{label}</span>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-7 w-11 cursor-pointer rounded border border-border bg-background p-0.5"
      />
    </label>
  )
}

function TokenSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded border border-border p-3">
      <p className="text-xs font-medium text-muted-foreground">{title}</p>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

export function ThemeTokensTab() {
  const [theme, setTheme] = useState<ThemeValues>(presets[0].values)
  const [fontFamily, setFontFamily] = useState('inherit')
  const [containerBorderVisible, setContainerBorderVisible] = useState(true)
  const [scrollbarTrack, setScrollbarTrack] = useState('#f8fafc')
  const [scrollbarThumb, setScrollbarThumb] = useState('#64748b')
  const [scrollbarThumbOpacity, setScrollbarThumbOpacity] = useState(0.3)
  const [scrollbarThumbHoverOpacity, setScrollbarThumbHoverOpacity] = useState(0.6)
  const [scrollbarSize, setScrollbarSize] = useState(8)
  const [previewTab, setPreviewTab] = useState<PreviewTab>('table')

  // Card tokens
  const [cardGap, setCardGap] = useState(16)
  const [cardPadding, setCardPadding] = useState(16)

  // Chat tokens
  const [chatGap, setChatGap] = useState(8)
  const [chatPadding, setChatPadding] = useState(12)

  const setToken = (key: keyof ThemeValues, value: string) => {
    setTheme((current) => ({ ...current, [key]: value }))
  }

  const themeStyle = {
    '--gridkit-background': theme.background,
    '--gridkit-foreground': theme.foreground,
    '--gridkit-popover': theme.popover,
    '--gridkit-popover-foreground': theme.popoverForeground,
    '--gridkit-primary': theme.primary,
    '--gridkit-primary-foreground': theme.primaryForeground,
    '--gridkit-secondary': theme.secondary,
    '--gridkit-secondary-foreground': theme.secondaryForeground,
    '--gridkit-muted': theme.muted,
    '--gridkit-muted-foreground': theme.mutedForeground,
    '--gridkit-header-background': theme.headerBackground,
    '--gridkit-header-foreground': theme.headerForeground,
    '--gridkit-header-border': theme.headerBorder,
    '--gridkit-header-control-background': theme.headerControlBackground,
    '--gridkit-header-control-foreground': theme.headerControlForeground,
    '--gridkit-header-control-border': theme.headerControlBorder,
    '--gridkit-header-control-placeholder': theme.headerControlPlaceholder,
    '--gridkit-header-popover-background': theme.headerPopoverBackground,
    '--gridkit-header-popover-foreground': theme.headerPopoverForeground,
    '--gridkit-header-popover-border': theme.headerPopoverBorder,
    '--gridkit-footer-background': theme.footerBackground,
    '--gridkit-footer-foreground': theme.footerForeground,
    '--gridkit-footer-border': theme.footerBorder,
    '--gridkit-accent': theme.accent,
    '--gridkit-accent-foreground': theme.accentForeground,
    '--gridkit-destructive': theme.destructive,
    '--gridkit-border': theme.border,
    '--gridkit-container-border': containerBorderVisible ? theme.containerBorder : 'transparent',
    '--gridkit-input': theme.input,
    '--gridkit-control-background': theme.controlBackground,
    '--gridkit-control-foreground': theme.controlForeground,
    '--gridkit-control-border': theme.controlBorder,
    '--gridkit-ring': theme.ring,
    '--gridkit-radius': theme.radius,
    '--gridkit-scrollbar-size': `${scrollbarSize}px`,
    '--gridkit-scrollbar-track': scrollbarTrack,
    '--gridkit-scrollbar-thumb': scrollbarThumb,
    '--gridkit-scrollbar-thumb-opacity': String(scrollbarThumbOpacity),
    '--gridkit-scrollbar-thumb-hover-opacity': String(scrollbarThumbHoverOpacity),
    '--gridkit-card-gap': `${cardGap}px`,
    '--gridkit-card-padding': `${cardPadding}px`,
    '--gridkit-chat-gap': `${chatGap}px`,
    '--gridkit-chat-padding': `${chatPadding}px`,
    fontFamily,
  } as React.CSSProperties

  const code = `.theme-scope {
  --gridkit-background: ${theme.background};
  --gridkit-foreground: ${theme.foreground};
  --gridkit-header-background: ${theme.headerBackground};
  --gridkit-header-foreground: ${theme.headerForeground};
  --gridkit-header-border: ${theme.headerBorder};
  --gridkit-header-control-background: ${theme.headerControlBackground};
  --gridkit-header-control-foreground: ${theme.headerControlForeground};
  --gridkit-header-control-border: ${theme.headerControlBorder};
  --gridkit-header-control-placeholder: ${theme.headerControlPlaceholder};
  --gridkit-header-popover-background: ${theme.headerPopoverBackground};
  --gridkit-header-popover-foreground: ${theme.headerPopoverForeground};
  --gridkit-header-popover-border: ${theme.headerPopoverBorder};
  --gridkit-footer-background: ${theme.footerBackground};
  --gridkit-footer-foreground: ${theme.footerForeground};
  --gridkit-footer-border: ${theme.footerBorder};
  --gridkit-control-background: ${theme.controlBackground};
  --gridkit-control-foreground: ${theme.controlForeground};
  --gridkit-control-border: ${theme.controlBorder};
  --gridkit-primary: ${theme.primary};
  --gridkit-border: ${theme.border};
  --gridkit-container-border: ${theme.containerBorder};
  --gridkit-card-gap: ${cardGap}px;
  --gridkit-card-padding: ${cardPadding}px;
  --gridkit-chat-gap: ${chatGap}px;
  --gridkit-chat-padding: ${chatPadding}px;
  --gridkit-scrollbar-size: ${scrollbarSize}px;
  --gridkit-scrollbar-track: ${scrollbarTrack};
  --gridkit-scrollbar-thumb: ${scrollbarThumb};
  --gridkit-scrollbar-thumb-opacity: ${scrollbarThumbOpacity};
  --gridkit-scrollbar-thumb-hover-opacity: ${scrollbarThumbHoverOpacity};
  --gridkit-radius: ${theme.radius};
}`

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold">Theme Tokens</p>
        <p className="text-sm text-muted-foreground">
          Adjust GridKit CSS variables and see the component update live. Typography is inherited from the app, not a GridKit token.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5 xl:items-start">
        {/* ── Left: controls ───────────────────────────────────────────── */}
        <section className="space-y-3 rounded border border-border p-4 xl:max-h-[calc(100vh-160px)] xl:overflow-y-auto">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted"
                onClick={() => setTheme(preset.values)}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* ── Shared: always visible ── */}
          <TokenSection title="Base">
            <TokenInput label="Background" value={theme.background} onChange={(value) => setToken('background', value)} />
            <TokenInput label="Foreground" value={theme.foreground} onChange={(value) => setToken('foreground', value)} />
            <TokenInput label="Border" value={theme.border} onChange={(value) => setToken('border', value)} />
            <TokenInput label="Primary" value={theme.primary} onChange={(value) => setToken('primary', value)} />
            <TokenInput label="Primary foreground" value={theme.primaryForeground} onChange={(value) => setToken('primaryForeground', value)} />
            <TokenInput label="Muted" value={theme.muted} onChange={(value) => setToken('muted', value)} />
            <TokenInput label="Muted foreground" value={theme.mutedForeground} onChange={(value) => setToken('mutedForeground', value)} />
            <label className="grid gap-1 text-xs text-muted-foreground">
              Radius: {theme.radius}
              <input
                type="range"
                min={0}
                max={12}
                value={Number.parseFloat(theme.radius) * 16}
                onChange={(event) => setToken('radius', `${Number(event.target.value) / 16}rem`)}
              />
            </label>
          </TokenSection>

          {/* ── Table-specific ── */}
          {previewTab === 'table' && (
            <>
              <TokenSection title="Header">
                <TokenInput label="Background" value={theme.headerBackground} onChange={(value) => setToken('headerBackground', value)} />
                <TokenInput label="Foreground" value={theme.headerForeground} onChange={(value) => setToken('headerForeground', value)} />
                <TokenInput label="Border" value={theme.headerBorder} onChange={(value) => setToken('headerBorder', value)} />
                <TokenInput label="Filter background" value={theme.headerControlBackground} onChange={(value) => setToken('headerControlBackground', value)} />
                <TokenInput label="Filter foreground" value={theme.headerControlForeground} onChange={(value) => setToken('headerControlForeground', value)} />
                <TokenInput label="Filter border" value={theme.headerControlBorder} onChange={(value) => setToken('headerControlBorder', value)} />
                <TokenInput label="Filter placeholder" value={theme.headerControlPlaceholder} onChange={(value) => setToken('headerControlPlaceholder', value)} />
                <TokenInput label="Popover background" value={theme.headerPopoverBackground} onChange={(value) => setToken('headerPopoverBackground', value)} />
                <TokenInput label="Popover foreground" value={theme.headerPopoverForeground} onChange={(value) => setToken('headerPopoverForeground', value)} />
                <TokenInput label="Popover border" value={theme.headerPopoverBorder} onChange={(value) => setToken('headerPopoverBorder', value)} />
              </TokenSection>

              <TokenSection title="Footer">
                <TokenInput label="Background" value={theme.footerBackground} onChange={(value) => setToken('footerBackground', value)} />
                <TokenInput label="Foreground" value={theme.footerForeground} onChange={(value) => setToken('footerForeground', value)} />
                <TokenInput label="Border" value={theme.footerBorder} onChange={(value) => setToken('footerBorder', value)} />
              </TokenSection>

              <TokenSection title="Controls">
                <TokenInput label="Background" value={theme.controlBackground} onChange={(value) => setToken('controlBackground', value)} />
                <TokenInput label="Foreground" value={theme.controlForeground} onChange={(value) => setToken('controlForeground', value)} />
                <TokenInput label="Border" value={theme.controlBorder} onChange={(value) => setToken('controlBorder', value)} />
                <TokenInput label="Secondary" value={theme.secondary} onChange={(value) => setToken('secondary', value)} />
                <TokenInput label="Secondary foreground" value={theme.secondaryForeground} onChange={(value) => setToken('secondaryForeground', value)} />
                <TokenInput label="Accent" value={theme.accent} onChange={(value) => setToken('accent', value)} />
                <TokenInput label="Accent foreground" value={theme.accentForeground} onChange={(value) => setToken('accentForeground', value)} />
                <TokenInput label="Destructive" value={theme.destructive} onChange={(value) => setToken('destructive', value)} />
                <TokenInput label="Ring" value={theme.ring} onChange={(value) => setToken('ring', value)} />
                <TokenInput label="Input border" value={theme.input} onChange={(value) => setToken('input', value)} />
              </TokenSection>

              <TokenSection title="Container">
                <div className="grid grid-cols-[1fr_44px] items-center gap-2 text-xs text-muted-foreground">
                  <span>Container border</span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={containerBorderVisible}
                    onClick={() => setContainerBorderVisible((v) => !v)}
                    className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors ${containerBorderVisible ? 'bg-primary' : 'bg-muted-foreground/40'}`}
                  >
                    <span className={`block h-4 w-4 rounded-full bg-white shadow-lg transition-transform ${containerBorderVisible ? 'translate-x-4' : 'translate-x-0'}`} />
                  </button>
                </div>
                {containerBorderVisible && (
                  <TokenInput label="Container border color" value={theme.containerBorder} onChange={(value) => setToken('containerBorder', value)} />
                )}

              </TokenSection>

              <TokenSection title="Popover">
                <TokenInput label="Background" value={theme.popover} onChange={(value) => setToken('popover', value)} />
                <TokenInput label="Foreground" value={theme.popoverForeground} onChange={(value) => setToken('popoverForeground', value)} />
              </TokenSection>
            </>
          )}

          {/* ── Card-specific ── */}
          {previewTab === 'card' && (
            <TokenSection title="Card layout">
              <label className="grid gap-1 text-xs text-muted-foreground">
                Gap between cards: {cardGap}px
                <input type="range" min={0} max={32} step={2} value={cardGap} onChange={(event) => setCardGap(Number(event.target.value))} />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Grid padding: {cardPadding}px
                <input type="range" min={0} max={32} step={2} value={cardPadding} onChange={(event) => setCardPadding(Number(event.target.value))} />
              </label>
            </TokenSection>
          )}

          {/* ── Chat-specific ── */}
          {previewTab === 'chat' && (
            <TokenSection title="Chat layout">
              <label className="grid gap-1 text-xs text-muted-foreground">
                Gap between messages: {chatGap}px
                <input type="range" min={0} max={32} step={2} value={chatGap} onChange={(event) => setChatGap(Number(event.target.value))} />
              </label>
              <label className="grid gap-1 text-xs text-muted-foreground">
                Container padding: {chatPadding}px
                <input type="range" min={0} max={32} step={2} value={chatPadding} onChange={(event) => setChatPadding(Number(event.target.value))} />
              </label>
            </TokenSection>
          )}

          {/* ── Shared: always visible ── */}
          <TokenSection title="Scrollbar">
            <TokenInput label="Track" value={scrollbarTrack} onChange={setScrollbarTrack} />
            <TokenInput label="Thumb" value={scrollbarThumb} onChange={setScrollbarThumb} />
            <label className="grid gap-1 text-xs text-muted-foreground">
              Size: {scrollbarSize}px
              <input type="range" min={4} max={16} step={1} value={scrollbarSize} onChange={(event) => setScrollbarSize(Number(event.target.value))} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Thumb opacity: {scrollbarThumbOpacity.toFixed(2)}
              <input type="range" min={0} max={1} step={0.05} value={scrollbarThumbOpacity} onChange={(event) => setScrollbarThumbOpacity(Number(event.target.value))} />
            </label>
            <label className="grid gap-1 text-xs text-muted-foreground">
              Thumb hover opacity: {scrollbarThumbHoverOpacity.toFixed(2)}
              <input type="range" min={0} max={1} step={0.05} value={scrollbarThumbHoverOpacity} onChange={(event) => setScrollbarThumbHoverOpacity(Number(event.target.value))} />
            </label>
          </TokenSection>

          <TokenSection title="Typography">
            <label className="grid gap-1 text-xs text-muted-foreground">
              Font family
              <select
                value={fontFamily}
                onChange={(event) => setFontFamily(event.target.value)}
                className="h-8 rounded border border-border bg-background px-2 text-xs text-foreground"
              >
                <option value="inherit">App default</option>
                <option value="Inter, system-ui, sans-serif">Inter/system</option>
                <option value="ui-monospace, SFMono-Regular, Menlo, monospace">Monospace</option>
                <option value="Georgia, serif">Serif</option>
              </select>
            </label>
            <p className="text-xs text-muted-foreground">
              GridKit inherits font family from the surrounding app. Font sizes are component styles, not theme tokens.
            </p>
          </TokenSection>
        </section>

        {/* ── Right: preview ───────────────────────────────────────────── */}
        <section className="space-y-3" style={themeStyle}>
          <div className="flex items-center gap-1">
            {(['table', 'card', 'chat'] as PreviewTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPreviewTab(tab)}
                className={`rounded px-3 py-1 text-xs capitalize ${
                  previewTab === tab
                    ? 'bg-primary text-primary-foreground'
                    : 'border border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {previewTab === 'table' && (
            <DataGrid
              data={SMALL_DATA}
              columns={tableColumns}
              headerGroupLayout="span"
              enableColumnFilters
              bordered
              tableHeight={320}
              pagination={{ pageSize: 10 }}
              footer={(table) => <DataGridPaginationBar table={table} className="pt-2" pageSizes={[10, 20, 50]} />}
              tableKey="theme-tokens-table"
            />
          )}

          {previewTab === 'card' && (
            <DataGridCard
              data={SMALL_DATA}
              columns={cardColumns}
              minCardWidth={200}
              minColumns={2}
              containerHeight={320}
              tableKey="theme-tokens-card"
              renderCard={(row) => {
                const e = row.original
                return (
                  <div className="flex flex-col gap-2 rounded-lg border border-border bg-background p-4 shadow-sm">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--gridkit-foreground)' }}>{e.name}</p>
                        <p className="text-xs" style={{ color: 'var(--gridkit-muted-foreground)' }}>{e.role}</p>
                      </div>
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_COLOR[e.status]}`}>
                        {e.status}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: 'var(--gridkit-muted-foreground)' }}>{e.department}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: 'var(--gridkit-foreground)' }}>${e.salary.toLocaleString()}</span>
                      <span className="text-xs" style={{ color: 'var(--gridkit-muted-foreground)' }}>#{e.id}</span>
                    </div>
                  </div>
                )
              }}
            />
          )}

          {previewTab === 'chat' && (
            <DataGridChat
              data={PREVIEW_MESSAGES}
              columns={chatColumns}
              getRowId={(m) => m.id}
              containerHeight={320}
              tableKey="theme-tokens-chat"
              renderMessage={(row) => {
                const m = row.original
                return (
                  <div className={`flex ${m.mine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className="max-w-[72%] rounded-lg px-3 py-2 text-sm"
                      style={
                        m.mine
                          ? { background: 'var(--gridkit-primary)', color: 'var(--gridkit-primary-foreground)' }
                          : { background: 'var(--gridkit-muted)', color: 'var(--gridkit-foreground)' }
                      }
                    >
                      <p className="mb-0.5 text-[11px] opacity-70">{m.author}</p>
                      <p>{m.body}</p>
                    </div>
                  </div>
                )
              }}
            />
          )}
        </section>
      </div>

      <div className="rounded border border-border bg-muted/30 p-3">
        <code className="block whitespace-pre-wrap text-xs text-muted-foreground">{code}</code>
      </div>
    </div>
  )
}

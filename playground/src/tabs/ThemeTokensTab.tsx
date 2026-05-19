import { useState } from 'react'
import type React from 'react'
import { DataGrid, DataGridPaginationBar } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'
import { SMALL_DATA, type Employee } from '../data/employees'

const columns: DataGridColumnDef<Employee>[] = [
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

  const setToken = (key: keyof ThemeValues, value: string) => {
    setTheme((current) => ({ ...current, [key]: value }))
  }

  const themeStyle = {
    '--dg-background': theme.background,
    '--dg-foreground': theme.foreground,
    '--dg-popover': theme.popover,
    '--dg-popover-foreground': theme.popoverForeground,
    '--dg-primary': theme.primary,
    '--dg-primary-foreground': theme.primaryForeground,
    '--dg-secondary': theme.secondary,
    '--dg-secondary-foreground': theme.secondaryForeground,
    '--dg-muted': theme.muted,
    '--dg-muted-foreground': theme.mutedForeground,
    '--dg-header-background': theme.headerBackground,
    '--dg-header-foreground': theme.headerForeground,
    '--dg-header-border': theme.headerBorder,
    '--dg-header-control-background': theme.headerControlBackground,
    '--dg-header-control-foreground': theme.headerControlForeground,
    '--dg-header-control-border': theme.headerControlBorder,
    '--dg-header-control-placeholder': theme.headerControlPlaceholder,
    '--dg-header-popover-background': theme.headerPopoverBackground,
    '--dg-header-popover-foreground': theme.headerPopoverForeground,
    '--dg-header-popover-border': theme.headerPopoverBorder,
    '--dg-footer-background': theme.footerBackground,
    '--dg-footer-foreground': theme.footerForeground,
    '--dg-footer-border': theme.footerBorder,
    '--dg-accent': theme.accent,
    '--dg-accent-foreground': theme.accentForeground,
    '--dg-destructive': theme.destructive,
    '--dg-border': theme.border,
    '--dg-input': theme.input,
    '--dg-control-background': theme.controlBackground,
    '--dg-control-foreground': theme.controlForeground,
    '--dg-control-border': theme.controlBorder,
    '--dg-ring': theme.ring,
    '--dg-radius': theme.radius,
    fontFamily,
  } as React.CSSProperties

  const code = `.theme-scope {
  --dg-background: ${theme.background};
  --dg-foreground: ${theme.foreground};
  --dg-header-background: ${theme.headerBackground};
  --dg-header-foreground: ${theme.headerForeground};
  --dg-header-border: ${theme.headerBorder};
  --dg-header-control-background: ${theme.headerControlBackground};
  --dg-header-control-foreground: ${theme.headerControlForeground};
  --dg-header-control-border: ${theme.headerControlBorder};
  --dg-header-control-placeholder: ${theme.headerControlPlaceholder};
  --dg-header-popover-background: ${theme.headerPopoverBackground};
  --dg-header-popover-foreground: ${theme.headerPopoverForeground};
  --dg-header-popover-border: ${theme.headerPopoverBorder};
  --dg-footer-background: ${theme.footerBackground};
  --dg-footer-foreground: ${theme.footerForeground};
  --dg-footer-border: ${theme.footerBorder};
  --dg-control-background: ${theme.controlBackground};
  --dg-control-foreground: ${theme.controlForeground};
  --dg-control-border: ${theme.controlBorder};
  --dg-primary: ${theme.primary};
  --dg-border: ${theme.border};
  --dg-radius: ${theme.radius};
}`

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-semibold">Theme Tokens</p>
        <p className="text-sm text-muted-foreground">
          Adjust GridKit CSS variables and see the table update live. Typography is inherited from the app, not a GridKit token.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[360px_minmax(0,1fr)] gap-5">
        <section className="space-y-3 rounded border border-border p-4">
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

          <TokenSection title="Base">
            <TokenInput label="Background" value={theme.background} onChange={(value) => setToken('background', value)} />
            <TokenInput label="Foreground" value={theme.foreground} onChange={(value) => setToken('foreground', value)} />
            <TokenInput label="Border" value={theme.border} onChange={(value) => setToken('border', value)} />
            <TokenInput label="Input border fallback" value={theme.input} onChange={(value) => setToken('input', value)} />
            <TokenInput label="Ring" value={theme.ring} onChange={(value) => setToken('ring', value)} />
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

          <TokenSection title="Header">
            <TokenInput label="Header background" value={theme.headerBackground} onChange={(value) => setToken('headerBackground', value)} />
            <TokenInput label="Header foreground" value={theme.headerForeground} onChange={(value) => setToken('headerForeground', value)} />
            <TokenInput label="Header border" value={theme.headerBorder} onChange={(value) => setToken('headerBorder', value)} />
            <TokenInput label="Filter control background" value={theme.headerControlBackground} onChange={(value) => setToken('headerControlBackground', value)} />
            <TokenInput label="Filter control foreground" value={theme.headerControlForeground} onChange={(value) => setToken('headerControlForeground', value)} />
            <TokenInput label="Filter control border" value={theme.headerControlBorder} onChange={(value) => setToken('headerControlBorder', value)} />
            <TokenInput label="Filter control placeholder" value={theme.headerControlPlaceholder} onChange={(value) => setToken('headerControlPlaceholder', value)} />
            <TokenInput label="Header popover background" value={theme.headerPopoverBackground} onChange={(value) => setToken('headerPopoverBackground', value)} />
            <TokenInput label="Header popover foreground" value={theme.headerPopoverForeground} onChange={(value) => setToken('headerPopoverForeground', value)} />
            <TokenInput label="Header popover border" value={theme.headerPopoverBorder} onChange={(value) => setToken('headerPopoverBorder', value)} />
          </TokenSection>

          <TokenSection title="Footer">
            <TokenInput label="Footer background" value={theme.footerBackground} onChange={(value) => setToken('footerBackground', value)} />
            <TokenInput label="Footer foreground" value={theme.footerForeground} onChange={(value) => setToken('footerForeground', value)} />
            <TokenInput label="Footer border" value={theme.footerBorder} onChange={(value) => setToken('footerBorder', value)} />
          </TokenSection>

          <TokenSection title="Controls">
            <TokenInput label="Control background" value={theme.controlBackground} onChange={(value) => setToken('controlBackground', value)} />
            <TokenInput label="Control foreground" value={theme.controlForeground} onChange={(value) => setToken('controlForeground', value)} />
            <TokenInput label="Control border" value={theme.controlBorder} onChange={(value) => setToken('controlBorder', value)} />
            <TokenInput label="Primary" value={theme.primary} onChange={(value) => setToken('primary', value)} />
            <TokenInput label="Primary foreground" value={theme.primaryForeground} onChange={(value) => setToken('primaryForeground', value)} />
            <TokenInput label="Secondary" value={theme.secondary} onChange={(value) => setToken('secondary', value)} />
            <TokenInput label="Secondary foreground" value={theme.secondaryForeground} onChange={(value) => setToken('secondaryForeground', value)} />
            <TokenInput label="Muted" value={theme.muted} onChange={(value) => setToken('muted', value)} />
            <TokenInput label="Muted foreground" value={theme.mutedForeground} onChange={(value) => setToken('mutedForeground', value)} />
            <TokenInput label="Accent" value={theme.accent} onChange={(value) => setToken('accent', value)} />
            <TokenInput label="Accent foreground" value={theme.accentForeground} onChange={(value) => setToken('accentForeground', value)} />
            <TokenInput label="Destructive" value={theme.destructive} onChange={(value) => setToken('destructive', value)} />
          </TokenSection>

          <TokenSection title="Popover">
            <TokenInput label="Popover" value={theme.popover} onChange={(value) => setToken('popover', value)} />
            <TokenInput label="Popover foreground" value={theme.popoverForeground} onChange={(value) => setToken('popoverForeground', value)} />
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

        <section className="space-y-3" style={themeStyle}>
          <p className="text-xs font-medium text-muted-foreground">Live DataGrid preview</p>
          <DataGrid
            data={SMALL_DATA}
            columns={columns}
            headerGroupLayout="span"
            enableColumnFilters
            bordered
            pagination={{ pageSize: 10 }}
            footer={(table) => <DataGridPaginationBar table={table} pageSizes={[10, 20, 50]} />}
            tableKey="theme-tokens-custom"
          />
        </section>
      </div>

      <div className="rounded border border-border bg-muted/30 p-3">
        <code className="block whitespace-pre-wrap text-xs text-muted-foreground">{code}</code>
      </div>
    </div>
  )
}

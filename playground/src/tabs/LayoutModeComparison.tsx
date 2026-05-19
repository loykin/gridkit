const rows = [
  {
    mode: 'fillContainer',
    purpose: 'Natural height until overflow',
    shortData: 'Footer follows the table',
    longData: 'Body scrolls inside the parent cap',
    useCase: 'Compact result sets that should not stretch',
  },
  {
    mode: 'fillParent',
    purpose: 'Fill the parent-owned height',
    shortData: 'Footer stays at the parent bottom',
    longData: 'Body scrolls inside the filled panel',
    useCase: 'Tabs, drawers, split panes, dashboard panels',
  },
]

export function LayoutModeComparison() {
  return (
    <div className="overflow-x-auto rounded border border-border">
      <table className="w-full min-w-[760px] text-left text-xs">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Mode</th>
            <th className="px-3 py-2 font-medium">Purpose</th>
            <th className="px-3 py-2 font-medium">Short data</th>
            <th className="px-3 py-2 font-medium">Long data</th>
            <th className="px-3 py-2 font-medium">Use case</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.mode} className="border-t border-border">
              <td className="px-3 py-2 font-mono text-[11px] text-foreground">{row.mode}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.purpose}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.shortData}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.longData}</td>
              <td className="px-3 py-2 text-muted-foreground">{row.useCase}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

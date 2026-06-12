import type { ReactNode } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { usageExampleCode, type ChartPoint, type promptExamples } from './simulator'

function ChartTooltip({ active, payload, label }: {
  active?: boolean
  payload?: Array<{ value?: number }>
  label?: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="rounded border border-border bg-background px-2 py-1 text-[11px] shadow-sm">
      <div className="font-medium text-foreground">{label}</div>
      <div className="text-muted-foreground">value: {payload[0]?.value}</div>
    </div>
  )
}

export function ChartArtifact({ title, points, color }: { title: ReactNode; points: ChartPoint[]; color?: string }) {
  return (
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
        <span className="rounded border border-border px-1.5 py-0.5">Recharts</span>
        {title}
      </div>
      <div className="h-48 rounded border border-border bg-background px-2 py-3">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={points} margin={{ top: 4, right: 8, bottom: 0, left: -22 }}>
            <CartesianGrid stroke="var(--dg-border)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--dg-muted-foreground)', fontSize: 11 }}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--dg-muted-foreground)', fontSize: 11 }}
            />
            <Tooltip cursor={{ fill: 'color-mix(in srgb, var(--dg-primary) 8%, transparent)' }} content={<ChartTooltip />} />
            <Bar dataKey="value" fill={color ?? 'var(--dg-primary)'} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function JsonLine({ line }: { line: string }) {
  const parts: ReactNode[] = []
  const pattern = /("(?:\\.|[^"\\])*"(?=\s*:)|"(?:\\.|[^"\\])*"|true|false|null|-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(line)) != null) {
    const value = match[0]
    if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index))

    let className = 'text-sky-600 dark:text-sky-300'
    if (value.startsWith('"') && line.slice(match.index + value.length).trimStart().startsWith(':')) {
      className = 'text-violet-600 dark:text-violet-300'
    } else if (value === 'true' || value === 'false') {
      className = 'text-amber-600 dark:text-amber-300'
    } else if (value === 'null') {
      className = 'text-muted-foreground'
    } else if (!value.startsWith('"')) {
      className = 'text-emerald-600 dark:text-emerald-300'
    }

    parts.push(
      <span key={`${match.index}-${value}`} className={className}>
        {value}
      </span>,
    )
    lastIndex = match.index + value.length
  }

  if (lastIndex < line.length) parts.push(line.slice(lastIndex))
  return <>{parts}</>
}

export function JsonViewer({
  value,
  indexLabel,
  indexOffset = 0,
}: {
  value: unknown
  indexLabel?: string
  indexOffset?: number
}) {
  const lines = JSON.stringify(value, null, 2).split('\n')
  let itemIndex = -1

  return (
    <div className="min-h-0 flex-1 overflow-auto bg-background">
      <div className="min-w-max py-2 font-mono text-[11px] leading-5">
        {lines.map((line, index) => {
          const isTopLevelArrayItem = Array.isArray(value) && /^  (?:\{|\[|"|true|false|null|-?\d)/.test(line)
          const hint = isTopLevelArrayItem && indexLabel ? `${indexLabel}[${indexOffset + ++itemIndex}]` : ''

          return (
            <div
              key={index}
              className={`grid ${indexLabel ? 'grid-cols-[3rem_8rem_minmax(max-content,1fr)]' : 'grid-cols-[3rem_minmax(max-content,1fr)]'}`}
            >
              <span className="select-none border-r border-border px-2 text-right text-muted-foreground/70">
                {index + 1}
              </span>
              {indexLabel && (
                <span className="select-none border-r border-border px-2 text-right text-primary/80">
                  {hint}
                </span>
              )}
              <code className="whitespace-pre px-3 text-foreground">
                <JsonLine line={line} />
              </code>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CodeLine({ line }: { line: string }) {
  const tokenPattern = /(\/\/.*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:type|interface|const|let|function|return|if|else|null|true|false|unknown|string|boolean|number|satisfies)\b|<\/?[A-Z][A-Za-z0-9.]*|[A-Z][A-Za-z0-9]*(?=[<({])|[a-zA-Z_$][\w$]*(?=\s*:))/g
  const parts: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = tokenPattern.exec(line)) != null) {
    const token = match[0]
    if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index))

    let className = 'text-foreground'
    if (token.startsWith('//')) {
      className = 'text-muted-foreground'
    } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith('`')) {
      className = 'text-emerald-600 dark:text-emerald-300'
    } else if (token.startsWith('<') || /^[A-Z]/.test(token)) {
      className = 'text-sky-600 dark:text-sky-300'
    } else if (token.endsWith(':')) {
      className = 'text-violet-600 dark:text-violet-300'
    } else {
      className = 'text-amber-600 dark:text-amber-300'
    }

    parts.push(
      <span key={`${match.index}-${token}`} className={className}>
        {token}
      </span>,
    )
    lastIndex = match.index + token.length
  }

  if (lastIndex < line.length) parts.push(line.slice(lastIndex))
  return <>{parts}</>
}

function CodeViewer({ code }: { code: string }) {
  const lines = code.split('\n')

  return (
    <div className="max-h-80 overflow-auto border-t border-border bg-background">
      <div className="min-w-max py-2 font-mono text-[11px] leading-5">
        {lines.map((line, index) => (
          <div key={index} className="grid grid-cols-[3rem_minmax(max-content,1fr)]">
            <span className="select-none border-r border-border px-2 text-right text-muted-foreground/70">
              {index + 1}
            </span>
            <code className="whitespace-pre px-3 text-foreground">
              {line ? <CodeLine line={line} /> : ' '}
            </code>
          </div>
        ))}
      </div>
    </div>
  )
}

export function UsageExample() {
  return (
    <details className="group overflow-hidden rounded border border-border bg-background">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-xs">
        <span className="font-semibold">Usage example</span>
        <span className="text-muted-foreground">
          Runtime hook owns append/update; adapter normalizes events for DataGridAgentChat.
        </span>
        <span className="ml-auto text-muted-foreground group-open:hidden">Show code</span>
        <span className="ml-auto hidden text-muted-foreground group-open:inline">Hide code</span>
      </summary>
      <CodeViewer code={usageExampleCode} />
    </details>
  )
}

export function EventInspector({
  step,
  title,
  description,
  events,
  indexLabel,
}: {
  step: string
  title: string
  description: string
  events: unknown[]
  indexLabel: string
}) {
  const visibleEvents = events.slice(-6)
  const indexOffset = Math.max(0, events.length - visibleEvents.length)

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded border border-border bg-background">
      <div className="flex min-w-0 flex-col gap-1 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-muted text-[11px] font-semibold">
            {step}
          </span>
          <div className="min-w-0 truncate text-xs font-semibold">{title}</div>
          <div className="ml-auto shrink-0 text-[11px] text-muted-foreground">{events.length} rows</div>
        </div>
        <p className="pl-7 text-[11px] leading-4 text-muted-foreground">{description}</p>
      </div>
      <JsonViewer value={visibleEvents} indexLabel={indexLabel} indexOffset={indexOffset} />
    </div>
  )
}

export function ChatComposer({
  prompt,
  examples,
  running,
  onPromptChange,
  onSend,
  onExampleRun,
  onReplay,
  onStop,
  onReset,
}: {
  prompt: string
  examples: typeof promptExamples
  running: boolean
  onPromptChange: (value: string) => void
  onSend: () => void
  onExampleRun: (prompt: string) => void
  onReplay: () => void
  onStop: () => void
  onReset: () => void
}) {
  const canSend = prompt.trim().length > 0 && !running

  return (
    <div className="min-w-0 border-t border-border bg-background p-3">
      <div className="mb-2 flex min-w-0 flex-wrap gap-1.5">
        {examples.map((example) => (
          <button
            key={example.label}
            onClick={() => onExampleRun(example.prompt)}
            disabled={running}
            className="rounded border border-border px-2 py-1 text-[11px] text-muted-foreground hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
          >
            Run {example.label}
          </button>
        ))}
      </div>
      <div className="flex items-end gap-2">
        <textarea
          value={prompt}
          onChange={(event) => onPromptChange(event.target.value)}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              if (canSend) onSend()
            }
          }}
          placeholder="Ask the agent to inspect a dataset, call a tool, and render artifacts..."
          className="min-h-16 min-w-0 flex-1 resize-none rounded border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <div className="flex shrink-0 flex-col gap-2">
          <button
            onClick={onSend}
            disabled={!canSend}
            className="rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
          <button
            onClick={onStop}
            disabled={!running}
            className="rounded border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
          >
            Stop
          </button>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span>Cmd/Ctrl + Enter sends</span>
        <button onClick={onReplay} disabled={!canSend} className="ml-auto hover:text-foreground disabled:opacity-50">
          Replay clean
        </button>
        <button onClick={onReset} className="hover:text-foreground">
          Reset
        </button>
      </div>
    </div>
  )
}

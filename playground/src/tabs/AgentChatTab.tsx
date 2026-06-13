import { useMemo, useState, type CSSProperties } from 'react'
import { DataGrid, DataGridAgentChat, GlobalSearch } from '@loykin/gridkit'
import {
  adapter,
  metricColumns,
  promptExamples,
  useAgentDemoRuntime,
  type ChartPoint,
  type MetricRow,
} from './agent-chat/simulator'
import {
  ChartArtifact,
  ChatComposer,
  EventInspector,
  JsonViewer,
  UsageExample,
} from './agent-chat/components'

const CHAT_TOKEN_PRESETS = {
  compact: {
    label: 'Compact',
    style: {
      '--gridkit-chat-gap': '8px',
      '--gridkit-chat-padding': '10px',
      '--gridkit-agent-chat-font-size': '13px',
      '--gridkit-agent-chat-event-gap': '4px',
      '--gridkit-agent-chat-assistant-max-width': '680px',
      '--gridkit-agent-chat-user-max-width': '560px',
      '--gridkit-agent-chat-code-font-size': '11px',
    },
  },
  balanced: {
    label: 'Balanced',
    style: {
      '--gridkit-chat-gap': '12px',
      '--gridkit-chat-padding': '16px',
      '--gridkit-agent-chat-font-size': '14px',
      '--gridkit-agent-chat-event-gap': '6px',
      '--gridkit-agent-chat-assistant-max-width': '760px',
      '--gridkit-agent-chat-user-max-width': '640px',
      '--gridkit-agent-chat-code-font-size': '12px',
    },
  },
  spacious: {
    label: 'Spacious',
    style: {
      '--gridkit-chat-gap': '18px',
      '--gridkit-chat-padding': '22px',
      '--gridkit-agent-chat-font-size': '15px',
      '--gridkit-agent-chat-event-gap': '8px',
      '--gridkit-agent-chat-assistant-max-width': '860px',
      '--gridkit-agent-chat-user-max-width': '720px',
      '--gridkit-agent-chat-code-font-size': '12px',
    },
  },
} as const

const CHART_COLORS = [
  { label: 'Primary', value: 'var(--gridkit-primary)' },
  { label: 'Teal', value: 'oklch(0.58 0.14 181)' },
  { label: 'Amber', value: 'oklch(0.68 0.16 70)' },
] as const

type ChatTokenPreset = keyof typeof CHAT_TOKEN_PRESETS
type ChartColor = (typeof CHART_COLORS)[number]['value']
type CSSVariableStyle = CSSProperties & Record<`--${string}`, string>

export function AgentChatTab() {
  const runtime = useAgentDemoRuntime()
  const [tokenPreset, setTokenPreset] = useState<ChatTokenPreset>('balanced')
  const [chartColor, setChartColor] = useState<ChartColor>('var(--gridkit-primary)')
  const chatStyle = {
    ...CHAT_TOKEN_PRESETS[tokenPreset].style,
    '--gridkit-agent-chat-user-background': 'color-mix(in srgb, var(--gridkit-primary) 9%, var(--gridkit-background))',
    '--gridkit-agent-chat-user-border': 'color-mix(in srgb, var(--gridkit-primary) 30%, var(--gridkit-border))',
  } satisfies CSSVariableStyle
  const adapterStats = useMemo(() => {
    const normalized = runtime.normalizedEvents
    return {
      provider: runtime.providerEvents.length,
      normalized: normalized.length,
      artifacts: normalized.filter((event) => event.type === 'artifact').length,
      tools: normalized.filter((event) => event.type === 'tool_call' || event.type === 'tool_result').length,
    }
  }, [runtime.normalizedEvents, runtime.providerEvents.length])

  return (
    <section className="flex h-full min-h-[760px] flex-col gap-3">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,380px)] gap-3">
        <div className="grid min-w-0 grid-cols-3 gap-2 rounded border border-border bg-background p-2 text-xs">
          <div className="min-w-0 rounded bg-muted/45 p-2">
            <div className="mb-1 flex items-center gap-2 font-semibold">
              <span className={`h-2 w-2 rounded-full ${runtime.running ? 'bg-yellow-400' : 'bg-emerald-400'}`} />
              1. Runtime hook
            </div>
            <code className="block truncate rounded bg-background px-1.5 py-0.5">useAgentDemoRuntime()</code>
            <p className="mt-1 leading-4 text-muted-foreground">
              App code appends or updates provider events from an LLM/tool SDK.
            </p>
          </div>
          <div className="min-w-0 rounded bg-muted/45 p-2">
            <div className="mb-1 font-semibold">2. Adapter</div>
            <code className="block truncate rounded bg-background px-1.5 py-0.5">adapter.toEvents(input)</code>
            <p className="mt-1 leading-4 text-muted-foreground">
              Converts the current provider snapshot into Gridkit AgentChatEvent rows.
            </p>
          </div>
          <div className="min-w-0 rounded bg-muted/45 p-2">
            <div className="mb-1 font-semibold">3. Renderer</div>
            <code className="block truncate rounded bg-background px-1.5 py-0.5">DataGridAgentChat</code>
            <p className="mt-1 leading-4 text-muted-foreground">
              Renders messages, tool rows, and artifacts through render slots.
            </p>
          </div>
        </div>

        <div className="grid min-w-0 grid-cols-4 gap-2 text-xs">
          <div className="rounded border border-border px-3 py-2">
            <div className="text-muted-foreground">Runtime log</div>
            <div className="mt-1 text-base font-semibold">{adapterStats.provider}</div>
            <div className="text-[10px] text-muted-foreground">input rows</div>
          </div>
          <div className="rounded border border-border px-3 py-2">
            <div className="text-muted-foreground">Grid rows</div>
            <div className="mt-1 text-base font-semibold">{adapterStats.normalized}</div>
            <div className="text-[10px] text-muted-foreground">rendered</div>
          </div>
          <div className="rounded border border-border px-3 py-2">
            <div className="text-muted-foreground">Tool rows</div>
            <div className="mt-1 text-base font-semibold">{adapterStats.tools}</div>
            <div className="text-[10px] text-muted-foreground">call/result</div>
          </div>
          <div className="rounded border border-border px-3 py-2">
            <div className="text-muted-foreground">Artifacts</div>
            <div className="mt-1 text-base font-semibold">{adapterStats.artifacts}</div>
            <div className="text-[10px] text-muted-foreground">chart/table</div>
          </div>
        </div>
      </div>

      <UsageExample />

      <div className="grid grid-cols-[minmax(0,1fr)_minmax(320px,380px)] gap-3">
        <div className="rounded border border-border bg-background p-3">
          <div className="mb-2 flex items-center gap-2 text-xs">
            <span className="font-semibold">Chat Theme Tokens</span>
            <span className="text-muted-foreground">CSS variables applied to DataGridAgentChat</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(CHAT_TOKEN_PRESETS).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => setTokenPreset(key as ChatTokenPreset)}
                className={`rounded border px-2 py-1 text-[11px] ${
                  tokenPreset === key
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {Object.entries(CHAT_TOKEN_PRESETS[tokenPreset].style).map(([token, value]) => (
              <div key={token} className="flex min-w-0 justify-between gap-2 rounded bg-muted/40 px-2 py-1">
                <code className="truncate">{token}</code>
                <span className="shrink-0">{value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded border border-border bg-background p-3">
          <div className="mb-2 text-xs font-semibold">Artifact Renderer</div>
          <div className="text-[11px] leading-4 text-muted-foreground">
            <code>renderArtifact</code> renders chart events with Recharts and table events with DataGrid.
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {CHART_COLORS.map((color) => (
              <button
                key={color.value}
                onClick={() => setChartColor(color.value)}
                className={`flex items-center gap-1.5 rounded border px-2 py-1 text-[11px] ${
                  chartColor === color.value ? 'border-primary text-foreground' : 'border-border text-muted-foreground hover:bg-muted'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color.value }} />
                {color.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[minmax(0,1fr)_minmax(320px,380px)] gap-3 overflow-hidden">
        <div className="min-h-0 min-w-0 overflow-hidden">
          <DataGridAgentChat
            input={runtime.providerEvents}
            adapter={adapter}
            containerHeight="100%"
            fillParent
            scrollbar={{ mode: 'custom' }}
            styles={{ frame: chatStyle as CSSProperties }}
            searchableColumns={['type', 'role', 'status', 'name', 'content']}
            headerRight={(table) => <GlobalSearch table={table} placeholder="Search agent events..." />}
            classNames={{
              artifact: 'shadow-sm',
              toolCall: 'border-dashed',
              toolResult: 'border-dashed',
            }}
            getEventClassName={(event) => event.status === 'error' ? 'border-destructive text-destructive' : undefined}
            footer={(
              <ChatComposer
                prompt={runtime.prompt}
                examples={promptExamples}
                running={runtime.running}
                onPromptChange={runtime.setPrompt}
                onSend={() => runtime.run(false)}
                onExampleRun={(prompt) => runtime.runPrompt(prompt, false)}
                onReplay={() => runtime.run(true)}
                onStop={runtime.stop}
                onReset={runtime.reset}
              />
            )}
            renderMessageContent={(event) => (
              <div className="whitespace-pre-wrap text-sm leading-6">
                {event.content}
                {event.status === 'streaming' && <span className="ml-1 inline-block h-4 w-1 animate-pulse bg-primary align-[-2px]" />}
              </div>
            )}
            renderToolCall={(event) => (
              <div className="flex min-w-0 flex-col gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold">{event.name}</span>
                  <span className="rounded border border-border px-1.5 py-0.5 text-muted-foreground">
                    {event.status}
                  </span>
                </div>
                <div className="max-w-full overflow-auto rounded border border-border bg-background">
                  <JsonViewer value={event.input} />
                </div>
              </div>
            )}
            renderToolResult={(event) => (
              <div className="flex min-w-0 flex-col gap-2">
                <div className="text-xs font-semibold text-muted-foreground">{event.name} result</div>
                <div className="max-w-full overflow-auto rounded border border-border bg-background">
                  <JsonViewer value={event.output} />
                </div>
              </div>
            )}
            renderArtifact={(event) => {
              if (event.kind === 'chart') {
                return <ChartArtifact title={event.title} points={event.data as ChartPoint[]} color={chartColor} />
              }

              if (event.kind === 'table') {
                return (
                  <div className="flex min-w-0 flex-col gap-2">
                    <div className="text-xs font-semibold text-muted-foreground">{event.title}</div>
                    <DataGrid
                      data={event.data as MetricRow[]}
                      columns={metricColumns}
                      showHeader
                      bordered
                      tableHeight="auto"
                      enableSorting={false}
                    />
                  </div>
                )
              }

              return null
            }}
            renderEventActions={(event) =>
              event.type === 'message' && event.role === 'assistant' ? (
                <>
                  <button className="rounded border border-border px-2 py-1 text-[11px] hover:bg-muted">
                    Copy
                  </button>
                  <button
                    onClick={() => runtime.run(false)}
                    disabled={runtime.running}
                    className="rounded border border-border px-2 py-1 text-[11px] hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Retry
                  </button>
                </>
              ) : null
            }
          />
        </div>

        <div className="grid min-h-0 min-w-0 grid-rows-2 gap-3 overflow-hidden">
          <EventInspector
            step="1"
            title="Runtime event log"
            description="This is what your app or LLM SDK hook appends/updates over time."
            events={runtime.providerEvents}
            indexLabel="providerEvents"
          />
          <EventInspector
            step="2"
            title="Gridkit rows after adapter"
            description="This is the normalized AgentChatEvent[] snapshot DataGridAgentChat renders."
            events={runtime.normalizedEvents}
            indexLabel="agentEvents"
          />
        </div>
      </div>
    </section>
  )
}

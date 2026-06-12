import { useCallback, useEffect, useRef, useState } from 'react'
import type { AgentChatAdapter, AgentChatEvent, DataGridColumnDef } from '@loykin/gridkit'

export type ProviderEvent =
  | { uid: string; kind: 'user'; text: string }
  | { uid: string; kind: 'assistant'; text: string; streaming?: boolean }
  | { uid: string; kind: 'tool'; tool: string; args: unknown; state: 'running' | 'complete' | 'error' }
  | { uid: string; kind: 'tool_result'; tool: string; result: unknown }
  | { uid: string; kind: 'chart'; title: string; points: ChartPoint[] }
  | { uid: string; kind: 'table'; title: string; rows: MetricRow[] }
  | { uid: string; kind: 'status'; state: 'running' | 'complete' | 'error'; label: string }

export interface ChartPoint {
  label: string
  value: number
}

export interface MetricRow {
  metric: string
  value: string
  delta: string
}

interface AgentScenario {
  intent: 'health' | 'incident' | 'comparison' | 'canary'
  plan: string
  tool: string
  args: Record<string, unknown>
  result: Record<string, unknown>
  chart: {
    title: string
    points: ChartPoint[]
  }
  table?: {
    title: string
    rows: MetricRow[]
  }
  statusNote?: string
  finalPartial: string
  finalComplete: string
}

export const initialPrompt = 'Show the deployment health summary and include anything that needs attention.'

export const promptExamples = [
  { label: 'Health', prompt: 'Show the deployment health summary and include anything that needs attention.' },
  { label: 'Incident', prompt: 'Investigate the 12:00 error spike and show a chart plus key metrics.' },
  { label: 'Compare', prompt: 'Compare checkout-api latency and saturation, then return a table artifact.' },
  { label: 'Canary', prompt: 'Summarize whether the canary can move from 25% to 50%.' },
]

export const seedEvents: ProviderEvent[] = [
  {
    uid: 'seed-u1',
    kind: 'user',
    text: initialPrompt,
  },
  {
    uid: 'seed-a1',
    kind: 'assistant',
    text: 'Use the example buttons below. Each one appends a different simulated agent run with different tools, charts, tables, and final answers.',
  },
]

export function toAgentEvents(events: ProviderEvent[]) {
  return events.map<AgentChatEvent>((event) => {
    if (event.kind === 'user') {
      return { id: event.uid, type: 'message', role: 'user', content: event.text }
    }

    if (event.kind === 'assistant') {
      return {
        id: event.uid,
        type: 'message',
        role: 'assistant',
        content: event.text,
        status: event.streaming ? 'streaming' : 'complete',
      }
    }

    if (event.kind === 'tool') {
      return {
        id: event.uid,
        type: 'tool_call',
        name: event.tool,
        input: event.args,
        status: event.state,
      }
    }

    if (event.kind === 'tool_result') {
      return { id: event.uid, type: 'tool_result', name: event.tool, output: event.result }
    }

    if (event.kind === 'chart') {
      return { id: event.uid, type: 'artifact', kind: 'chart', title: event.title, data: event.points }
    }

    if (event.kind === 'table') {
      return { id: event.uid, type: 'artifact', kind: 'table', title: event.title, data: event.rows }
    }

    return { id: event.uid, type: 'status', status: event.state, label: event.label }
  })
}

export const adapter: AgentChatAdapter<ProviderEvent[]> = toAgentEvents

export const usageExampleCode = `type ProviderEvent =
  | { uid: string; kind: 'user'; text: string }
  | { uid: string; kind: 'assistant'; text: string; streaming?: boolean }
  | { uid: string; kind: 'tool'; tool: string; args: unknown; state: 'running' | 'complete' | 'error' }
  | { uid: string; kind: 'chart' | 'table'; title: string; data: unknown }

const adapter: AgentChatAdapter<ProviderEvent[]> = (events) =>
  events.map((event) => {
    if (event.kind === 'user') {
      return { id: event.uid, type: 'message', role: 'user', content: event.text }
    }

    if (event.kind === 'assistant') {
      return {
        id: event.uid,
        type: 'message',
        role: 'assistant',
        content: event.text,
        status: event.streaming ? 'streaming' : 'complete',
      }
    }

    if (event.kind === 'tool') {
      return {
        id: event.uid,
        type: 'tool_call',
        name: event.tool,
        input: event.args,
        status: event.state,
      }
    }

    return {
      id: event.uid,
      type: 'artifact',
      kind: event.kind,
      title: event.title,
      data: event.data,
    }
  })

function AgentChat() {
  const agent = useMyAgentRuntime()

  return (
    <DataGridAgentChat
      input={agent.events}
      adapter={adapter}
      footer={<Composer onSubmit={agent.submit} onStop={agent.stop} />}
      renderArtifact={(event) => {
        if (event.kind === 'chart') return <Chart data={event.data} />
        if (event.kind === 'table') return <DataGrid data={event.data.rows} columns={event.data.columns} />
        return null
      }}
    />
  )
}`

export const metricColumns: DataGridColumnDef<MetricRow>[] = [
  { accessorKey: 'metric', header: 'Metric' },
  { accessorKey: 'value', header: 'Value' },
  { accessorKey: 'delta', header: 'Delta' },
]

function buildScenario(prompt: string): AgentScenario {
  const text = prompt.toLowerCase()

  if (text.includes('12:00') || text.includes('spike') || text.includes('incident')) {
    return {
      intent: 'incident',
      plan: 'I will inspect the incident window, fetch error-rate samples, and isolate whether the spike persisted.',
      tool: 'incident.timeline',
      args: { service: 'checkout-api', incidentWindow: '11:45-12:20', signals: ['errors', 'retries', 'deployments'] },
      result: { rootCause: 'retry policy warm-up', peakErrorRate: '3.8%', durationMinutes: 14, userImpact: 'low' },
      chart: {
        title: 'Incident error-rate timeline',
        points: [
          { label: '11:45', value: 0.6 },
          { label: '12:00', value: 3.8 },
          { label: '12:15', value: 1.4 },
          { label: '12:30', value: 0.7 },
        ],
      },
      table: {
        title: 'Incident signals',
        rows: [
          { metric: 'peak error rate', value: '3.8%', delta: '+3.1%' },
          { metric: 'retry volume', value: '18.2k', delta: '+42%' },
          { metric: 'affected requests', value: '0.7%', delta: '+0.5%' },
          { metric: 'rollback needed', value: 'no', delta: 'unchanged' },
        ],
      },
      statusNote: 'Incident path produced chart + table artifacts.',
      finalPartial: 'The 12:00 spike looks isolated and tied to retry warm-up.',
      finalComplete: 'The 12:00 spike looks isolated and tied to retry warm-up. It lasted about 14 minutes, peaked at 3.8%, and recovered without a rollback. I would keep monitoring retry volume, but this does not look like an active incident.',
    }
  }

  if (text.includes('latency') || text.includes('saturation') || text.includes('compare')) {
    return {
      intent: 'comparison',
      plan: 'I will compare latency and saturation trends, then render a chart and metrics table for the current deployment.',
      tool: 'metrics.compare',
      args: { service: 'checkout-api', metrics: ['p95_latency', 'saturation'], baseline: 'previous_deploy' },
      result: { p95DeltaMs: 18, saturationDelta: '6%', regression: 'minor' },
      chart: {
        title: 'Latency and saturation comparison',
        points: [
          { label: 'baseline', value: 42 },
          { label: 'canary', value: 48 },
          { label: 'current', value: 67 },
          { label: 'target', value: 45 },
        ],
      },
      table: {
        title: 'Comparison metrics',
        rows: [
          { metric: 'p95 latency', value: '211 ms', delta: '+18 ms' },
          { metric: 'saturation', value: '67%', delta: '+6%' },
          { metric: 'queue depth', value: '312', delta: '+44' },
          { metric: 'regression', value: 'minor', delta: 'watch' },
        ],
      },
      statusNote: 'Comparison path produced both chart + table artifacts.',
      finalPartial: 'Latency and saturation are both higher than baseline.',
      finalComplete: 'Latency and saturation are both higher than baseline, but the regression is still minor. The chart shows saturation drifting above target, and the table shows p95 latency at 211 ms. I would avoid widening traffic until saturation drops below 64%.',
    }
  }

  if (text.includes('canary') || text.includes('25%') || text.includes('50%')) {
    return {
      intent: 'canary',
      plan: 'I will evaluate canary promotion readiness from error rate, latency, saturation, and rollback risk.',
      tool: 'deploy.canary_assess',
      args: { service: 'checkout-api', from: '25%', to: '50%', policy: 'standard-risk' },
      result: { decision: 'hold', blockers: ['saturation above threshold'], nextReview: '1 window' },
      chart: {
        title: 'Canary promotion score',
        points: [
          { label: 'errors', value: 92 },
          { label: 'latency', value: 78 },
          { label: 'capacity', value: 61 },
          { label: 'overall', value: 73 },
        ],
      },
      table: {
        title: 'Promotion gates',
        rows: [
          { metric: 'error gate', value: 'pass', delta: '-1.1%' },
          { metric: 'latency gate', value: 'pass', delta: '+12 ms' },
          { metric: 'capacity gate', value: 'hold', delta: '+6%' },
        ],
      },
      statusNote: 'Canary path includes promotion gate evaluation.',
      finalPartial: 'I would not move the canary to 50% yet.',
      finalComplete: 'I would not move the canary to 50% yet. Error and latency gates pass, but the capacity gate is still in hold because saturation is above the promotion threshold. Keep the canary at 25% for one more window.',
    }
  }

  return {
    intent: 'health',
    plan: 'I will query deployment health, summarize the current risk, and attach chart and table artifacts.',
    tool: 'metrics.query',
    args: { service: 'checkout-api', window: '4h', groupBy: 'deployment' },
    result: { samples: 4, highestErrorRate: '1.9%', recovered: true },
    chart: {
      title: 'Error rate by deployment',
      points: [
        { label: '10:00', value: 0.4 },
        { label: '11:00', value: 0.7 },
        { label: '12:00', value: 1.9 },
        { label: '13:00', value: 0.8 },
      ],
    },
    table: {
      title: 'Key metrics',
      rows: [
        { metric: 'p95 latency', value: '184 ms', delta: '+12 ms' },
        { metric: 'error rate', value: '0.8%', delta: '-1.1%' },
        { metric: 'saturation', value: '61%', delta: '+4%' },
      ],
    },
    finalPartial: 'The deployment is healthy. I found a short error-rate spike at 12:00',
    finalComplete: 'The deployment is healthy. I found a short error-rate spike at 12:00, but it recovered after the retry policy warmed up. Keep the canary at 25% for one more window before widening traffic.',
  }
}

function nextRunEvents(prompt: string, runId: number) {
  const scenario = buildScenario(prompt)
  const artifacts: ProviderEvent[] = []

  artifacts.push({
    uid: `${runId}-chart`,
    kind: 'chart',
    title: scenario.chart.title,
    points: scenario.chart.points,
  })

  if (scenario.table) {
    artifacts.push({
      uid: `${runId}-table`,
      kind: 'table',
      title: scenario.table.title,
      rows: scenario.table.rows,
    })
  }

  if (scenario.statusNote) {
    artifacts.push({
      uid: `${runId}-note`,
      kind: 'status',
      state: 'complete',
      label: scenario.statusNote,
    })
  }

  return {
    intent: scenario.intent,
    artifacts,
    user: { uid: `${runId}-user`, kind: 'user', text: prompt } satisfies ProviderEvent,
    planning: {
      uid: `${runId}-plan`,
      kind: 'assistant',
      text: scenario.plan,
      streaming: true,
    } satisfies ProviderEvent,
    toolRunning: {
      uid: `${runId}-tool`,
      kind: 'tool',
      tool: scenario.tool,
      args: scenario.args,
      state: 'running',
    } satisfies ProviderEvent,
    toolComplete: {
      uid: `${runId}-tool`,
      kind: 'tool',
      tool: scenario.tool,
      args: scenario.args,
      state: 'complete',
    } satisfies ProviderEvent,
    toolResult: {
      uid: `${runId}-result`,
      kind: 'tool_result',
      tool: scenario.tool,
      result: scenario.result,
    } satisfies ProviderEvent,
    finalPartial: {
      uid: `${runId}-final`,
      kind: 'assistant',
      text: scenario.finalPartial,
      streaming: true,
    } satisfies ProviderEvent,
    finalComplete: {
      uid: `${runId}-final`,
      kind: 'assistant',
      text: scenario.finalComplete,
    } satisfies ProviderEvent,
    done: {
      uid: `${runId}-done`,
      kind: 'status',
      state: 'complete',
      label: 'Agent run completed',
    } satisfies ProviderEvent,
  }
}

export function useAgentDemoRuntime() {
  const [providerEvents, setProviderEvents] = useState<ProviderEvent[]>(seedEvents)
  const [prompt, setPrompt] = useState(initialPrompt)
  const [running, setRunning] = useState(false)
  const runCounterRef = useRef(1)
  const timersRef = useRef<number[]>([])

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])

  const schedule = useCallback((delay: number, update: () => void) => {
    const timer = window.setTimeout(update, delay)
    timersRef.current.push(timer)
  }, [])

  const runPrompt = useCallback((nextPrompt: string, replaceHistory = false) => {
    const trimmed = nextPrompt.trim()
    if (!trimmed || running) return

    clearTimers()
    setRunning(true)
    setPrompt(trimmed)

    const runId = runCounterRef.current++
    const events = nextRunEvents(trimmed, runId)

    setProviderEvents((current) => {
      const base = replaceHistory ? [] : current
      return [...base, events.user, events.planning]
    })

    schedule(600, () => {
      setProviderEvents((current) => [...current, events.toolRunning])
    })
    schedule(1200, () => {
      setProviderEvents((current) => current.map((event) => event.uid === events.toolRunning.uid ? events.toolComplete : event))
    })
    schedule(1600, () => {
      setProviderEvents((current) => [...current, events.toolResult])
    })
    schedule(2100, () => {
      setProviderEvents((current) => [...current, events.finalPartial])
    })
    schedule(2900, () => {
      setProviderEvents((current) => current.map((event) => event.uid === events.finalPartial.uid ? events.finalComplete : event))
    })
    events.artifacts.forEach((artifact, index) => {
      schedule(3300 + index * 500, () => {
        setProviderEvents((current) => [...current, artifact])
      })
    })
    schedule(3300 + events.artifacts.length * 500, () => {
      setProviderEvents((current) => [...current, events.done])
      setRunning(false)
    })
  }, [clearTimers, running, schedule])

  const run = useCallback((replaceHistory = false) => {
    runPrompt(prompt, replaceHistory)
  }, [prompt, runPrompt])

  const stop = useCallback(() => {
    clearTimers()
    setRunning(false)
    setProviderEvents((current) => [
      ...current.map((event) => {
        if (event.kind === 'assistant' && event.streaming) return { ...event, streaming: false }
        if (event.kind === 'tool' && event.state === 'running') return { ...event, state: 'error' as const }
        return event
      }),
      {
        uid: `stop-${Date.now()}`,
        kind: 'status',
        state: 'error',
        label: 'Agent run stopped',
      } satisfies ProviderEvent,
    ])
  }, [clearTimers])

  const reset = useCallback(() => {
    clearTimers()
    setRunning(false)
    setProviderEvents(seedEvents)
    setPrompt(initialPrompt)
  }, [clearTimers])

  useEffect(() => clearTimers, [clearTimers])

  return {
    providerEvents,
    normalizedEvents: toAgentEvents(providerEvents),
    prompt,
    running,
    setPrompt,
    run,
    runPrompt,
    stop,
    reset,
  }
}

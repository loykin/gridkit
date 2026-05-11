import { useEffect, useRef, useState } from 'react'
import { DataGridList, SelectFilter } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'

type TraceEntryType = 'tool_call' | 'tool_result' | 'llm_response' | 'retrieval'
type TraceStatus = 'running' | 'success' | 'error'

interface TraceEntry {
  id: string
  type: TraceEntryType
  status: TraceStatus
  label: string
  detail: string
  durationMs?: number
  timestamp: string
}

const ENTRIES: Omit<TraceEntry, 'id' | 'timestamp'>[] = [
  { type: 'llm_response', status: 'success', label: 'Plan step', detail: 'I will search for recent papers on RLHF and summarize the key findings.', durationMs: 812 },
  { type: 'tool_call', status: 'success', label: 'web_search', detail: '{"query": "RLHF recent papers 2024"}', durationMs: 340 },
  { type: 'retrieval', status: 'success', label: '4 results', detail: 'Constitutional AI (Anthropic 2022), RLAIF (2023), DPO (2023), GRPO (2024)', durationMs: 55 },
  { type: 'tool_call', status: 'success', label: 'read_url', detail: '{"url": "https://arxiv.org/abs/2212.08073"}', durationMs: 610 },
  { type: 'tool_result', status: 'success', label: 'Content fetched', detail: 'Constitutional AI: Harmlessness from AI Feedback — 68 pages.', durationMs: undefined },
  { type: 'llm_response', status: 'success', label: 'Synthesize', detail: 'The key trend is replacing human preference labels with AI-generated feedback. DPO simplifies the RLHF pipeline by eliminating the reward model.', durationMs: 1240 },
  { type: 'tool_call', status: 'error', label: 'code_exec', detail: '{"code": "import matplotlib; ..."}', durationMs: 200 },
  { type: 'tool_result', status: 'error', label: 'Execution failed', detail: 'ModuleNotFoundError: No module named matplotlib', durationMs: undefined },
  { type: 'llm_response', status: 'success', label: 'Handle error', detail: 'The visualization step failed. I will provide the summary in text form instead.', durationMs: 540 },
  { type: 'tool_call', status: 'success', label: 'write_file', detail: '{"path": "summary.md", "content": "# RLHF Survey ..."}', durationMs: 28 },
  { type: 'tool_result', status: 'success', label: 'File written', detail: 'summary.md (1.4 KB)', durationMs: undefined },
  { type: 'llm_response', status: 'success', label: 'Final answer', detail: 'Done. summary.md has been written with a 4-paper comparison covering Constitutional AI, RLAIF, DPO, and GRPO.', durationMs: 680 },
]

const TYPE_ICON: Record<TraceEntryType, string> = {
  tool_call: '⚙',
  tool_result: '↩',
  llm_response: '◆',
  retrieval: '⊞',
}

const TYPE_COLOR: Record<TraceEntryType, string> = {
  tool_call: 'text-blue-500',
  tool_result: 'text-slate-400',
  llm_response: 'text-violet-500',
  retrieval: 'text-emerald-500',
}

const STATUS_DOT: Record<TraceStatus, string> = {
  running: 'bg-yellow-400 animate-pulse',
  success: 'bg-emerald-400',
  error: 'bg-red-400',
}

const columns: DataGridColumnDef<TraceEntry>[] = [
  { accessorKey: 'type', meta: { filterType: 'select' } },
  { accessorKey: 'status', meta: { filterType: 'select' } },
  { accessorKey: 'label' },
  { accessorKey: 'detail' },
]

function makeEntry(index: number): TraceEntry {
  const template = ENTRIES[index % ENTRIES.length]!
  return {
    ...template,
    id: String(Date.now()) + String(index),
    timestamp: new Date().toISOString().slice(11, 23),
  }
}

export function AgentTraceTab() {
  const [entries, setEntries] = useState<TraceEntry[]>(() =>
    ENTRIES.slice(0, 6).map((e, i) => ({ ...e, id: String(i), timestamp: `09:0${i}:00.000` })),
  )
  const [running, setRunning] = useState(false)
  const counterRef = useRef(ENTRIES.length)

  useEffect(() => {
    if (!running) return
    const interval = setInterval(() => {
      setEntries((prev) => {
        const next = makeEntry(counterRef.current++)
        return [...prev, next]
      })
    }, 600)
    return () => clearInterval(interval)
  }, [running])

  const reset = () => {
    setRunning(false)
    counterRef.current = ENTRIES.length
    setEntries(ENTRIES.slice(0, 6).map((e, i) => ({ ...e, id: String(i), timestamp: `09:0${i}:00.000` })))
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Agent execution trace — tool calls, LLM responses, retrieval results ({entries.length} entries)
        </p>
        <div className="ml-auto flex gap-2">
          <button
            onClick={() => setRunning((v) => !v)}
            className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
          >
            {running ? 'Pause' : 'Stream'}
          </button>
          <button
            onClick={reset}
            className="rounded border border-border px-3 py-1 text-xs hover:bg-muted"
          >
            Reset
          </button>
        </div>
      </div>

      <DataGridList
        data={entries}
        columns={columns}
        getRowId={(e) => e.id}
        containerHeight={520}
        enableSorting={false}
        headerLeft={(table) => (
          <>
            <SelectFilter table={table} columnId="type" label="Type" />
            <SelectFilter table={table} columnId="status" label="Status" />
          </>
        )}
        renderItem={(row) => {
          const entry = row.original
          return (
            <div className="flex items-start gap-3 border-b border-border px-4 py-2.5 font-mono text-xs">
              <span className="mt-0.5 text-muted-foreground shrink-0">{entry.timestamp}</span>
              <span className={`mt-0.5 shrink-0 ${TYPE_COLOR[entry.type]}`}>
                {TYPE_ICON[entry.type]}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-semibold text-foreground">{entry.label}</span>
                  {entry.durationMs != null && (
                    <span className="text-muted-foreground">{entry.durationMs}ms</span>
                  )}
                </div>
                <p className="text-muted-foreground truncate">{entry.detail}</p>
              </div>
              <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${STATUS_DOT[entry.status]}`} />
            </div>
          )
        }}
      />
    </section>
  )
}

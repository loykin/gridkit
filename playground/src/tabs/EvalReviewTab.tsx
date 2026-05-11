import { useState } from 'react'
import { DataGridList, GlobalSearch, SelectFilter } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'

type ReviewStatus = 'pending' | 'passed' | 'failed' | 'flagged'

interface EvalEntry {
  id: string
  input: string
  output: string
  expected: string
  score: number
  status: ReviewStatus
  model: string
  category: string
}

const RAW: Omit<EvalEntry, 'id'>[] = [
  { input: 'Summarize the key findings of the 2024 RLHF survey.', output: 'RLHF has shifted toward AI-generated feedback. DPO eliminates the reward model step.', expected: 'Covers DPO and RLAIF trends.', score: 0.91, status: 'passed', model: 'claude-3-5-sonnet', category: 'summarization' },
  { input: 'What is the capital of Australia?', output: 'Sydney', expected: 'Canberra', score: 0.10, status: 'failed', model: 'claude-3-haiku', category: 'factual' },
  { input: 'Translate "hello" to French.', output: 'Bonjour', expected: 'Bonjour', score: 1.00, status: 'passed', model: 'claude-3-5-sonnet', category: 'translation' },
  { input: 'Write a Python function to reverse a string.', output: 'def rev(s): return s[::-1]', expected: 'Any correct implementation.', score: 0.88, status: 'pending', model: 'claude-3-5-haiku', category: 'coding' },
  { input: 'Explain gradient descent in one sentence.', output: 'Gradient descent iteratively adjusts parameters by moving in the direction of steepest loss reduction.', expected: 'Should mention loss minimization.', score: 0.95, status: 'passed', model: 'claude-3-5-sonnet', category: 'explanation' },
  { input: 'List 3 uses of transformer models.', output: 'Text generation, image captioning, code completion.', expected: 'At least 3 valid uses.', score: 0.82, status: 'pending', model: 'claude-3-haiku', category: 'enumeration' },
  { input: 'Is 17 a prime number?', output: 'No', expected: 'Yes', score: 0.00, status: 'flagged', model: 'claude-3-haiku', category: 'factual' },
  { input: 'Convert 100°C to Fahrenheit.', output: '212°F', expected: '212°F', score: 1.00, status: 'passed', model: 'claude-3-5-haiku', category: 'math' },
  { input: 'What does RAG stand for?', output: 'Retrieval-Augmented Generation', expected: 'Retrieval-Augmented Generation', score: 1.00, status: 'passed', model: 'claude-3-5-sonnet', category: 'factual' },
  { input: 'Write a regex to match emails.', output: '/[^@]+@[^@]+\\.[^@]+/', expected: 'Any reasonable email regex.', score: 0.75, status: 'pending', model: 'claude-3-5-haiku', category: 'coding' },
  { input: 'Who wrote Pride and Prejudice?', output: 'Jane Austen', expected: 'Jane Austen', score: 1.00, status: 'passed', model: 'claude-3-haiku', category: 'factual' },
  { input: 'Explain overfitting in ML.', output: 'Overfitting is when a model learns noise in training data and generalizes poorly to new data.', expected: 'Should mention generalization.', score: 0.93, status: 'pending', model: 'claude-3-5-sonnet', category: 'explanation' },
]

const INITIAL: EvalEntry[] = RAW.map((r, i) => ({ ...r, id: String(i + 1) }))

const SCORE_COLOR = (s: number) => {
  if (s >= 0.9) return 'text-emerald-500'
  if (s >= 0.6) return 'text-yellow-500'
  return 'text-red-500'
}

const STATUS_STYLE: Record<ReviewStatus, string> = {
  pending: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
  passed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  flagged: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-500',
}

const columns: DataGridColumnDef<EvalEntry>[] = [
  { accessorKey: 'status', meta: { filterType: 'select' } },
  { accessorKey: 'model', meta: { filterType: 'select' } },
  { accessorKey: 'category', meta: { filterType: 'select' } },
  { accessorKey: 'input' },
  { accessorKey: 'output' },
  { accessorKey: 'score', enableSorting: true },
]

export function EvalReviewTab() {
  const [entries, setEntries] = useState<EvalEntry[]>(INITIAL)

  const setStatus = (id: string, status: ReviewStatus) => {
    setEntries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
  }

  const pendingCount = entries.filter((e) => e.status === 'pending').length

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <p className="text-xs text-muted-foreground">
          Eval review queue — click Pass / Fail to update status ({pendingCount} pending)
        </p>
      </div>

      <DataGridList
        data={entries}
        columns={columns}
        getRowId={(e) => e.id}
        containerHeight={520}
        enableSorting
        initialSorting={[{ id: 'score', desc: false }]}
        leftFilters={(table) => (
          <>
            <SelectFilter table={table} columnId="status" label="Status" />
            <SelectFilter table={table} columnId="model" label="Model" />
            <SelectFilter table={table} columnId="category" label="Category" />
          </>
        )}
        rightFilters={(table) => <GlobalSearch table={table} placeholder="Search..." />}
        emptyMessage="No eval entries found"
        renderItem={(row) => {
          const entry = row.original
          return (
            <div className="flex items-start gap-3 border-b border-border px-4 py-3 hover:bg-accent/50 transition-colors">
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${STATUS_STYLE[entry.status]}`}>
                    {entry.status}
                  </span>
                  <span className="text-[11px] text-muted-foreground">{entry.model}</span>
                  <span className="text-[11px] text-muted-foreground">· {entry.category}</span>
                  <span className={`ml-auto text-sm font-semibold tabular-nums ${SCORE_COLOR(entry.score)}`}>
                    {entry.score.toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  <span className="font-medium text-foreground">Q: </span>{entry.input}
                </p>
                <p className="text-xs truncate">
                  <span className="font-medium text-muted-foreground">A: </span>{entry.output}
                </p>
              </div>
              <div className="flex gap-1.5 shrink-0 mt-0.5">
                <button
                  onClick={() => setStatus(entry.id, 'passed')}
                  disabled={entry.status === 'passed'}
                  className="rounded border border-border px-2 py-0.5 text-[11px] text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 disabled:opacity-30 disabled:cursor-default transition-colors"
                >
                  Pass
                </button>
                <button
                  onClick={() => setStatus(entry.id, 'failed')}
                  disabled={entry.status === 'failed'}
                  className="rounded border border-border px-2 py-0.5 text-[11px] text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-30 disabled:cursor-default transition-colors"
                >
                  Fail
                </button>
                <button
                  onClick={() => setStatus(entry.id, 'flagged')}
                  disabled={entry.status === 'flagged'}
                  className="rounded border border-border px-2 py-0.5 text-[11px] text-yellow-600 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 disabled:opacity-30 disabled:cursor-default transition-colors"
                >
                  Flag
                </button>
              </div>
            </div>
          )
        }}
      />
    </section>
  )
}

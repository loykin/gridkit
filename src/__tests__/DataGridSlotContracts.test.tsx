import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataGrid } from '@/DataGrid'
import { DataGridCard } from '@/DataGridCard'
import { DataGridChat } from '@/DataGridChat'
import { DataGridList } from '@/DataGridList'
import { DataGridAgentChat } from '@/DataGridAgentChat'
import type { DataGridColumnDef } from '@/types'

// ── Shared fixtures ────────────────────────────────────────────────────────────

interface Row { id: string; label: string }

const columns: DataGridColumnDef<Row>[] = [
  { id: 'id', accessorKey: 'id' },
  { id: 'label', accessorKey: 'label' },
]
const getRowId = (r: Row) => r.id

const ERROR = new Error('fetch failed')

describe('view overflow contracts', () => {
  it('does not apply the Card visual-overflow policy to Table, List, or Chat', () => {
    const table = render(<DataGrid data={[]} columns={columns} getRowId={getRowId} />)
    const list = render(
      <DataGridList
        data={[]}
        columns={columns}
        getRowId={getRowId}
        renderItem={(row) => <div>{row.original.label}</div>}
      />,
    )
    const chat = render(
      <DataGridChat
        data={[]}
        columns={columns}
        getRowId={getRowId}
        renderMessage={(row) => <div>{row.original.label}</div>}
      />,
    )

    expect(table.container.querySelector('.gridkit-shell')).not.toHaveAttribute('data-visual-overflow')
    expect(list.container.querySelector('.gridkit-shell')).not.toHaveAttribute('data-visual-overflow')
    expect(chat.container.querySelector('.gridkit-shell')).not.toHaveAttribute('data-visual-overflow')
  })
})

// ── Table: styles.loading ──────────────────────────────────────────────────────

describe('DataGrid (Table) slot contracts', () => {
  it('applies styles.loading to the loading rowgroup', () => {
    const { container } = render(
      <DataGrid
        data={[]}
        columns={columns}
        getRowId={getRowId}
        isLoading
        styles={{ loading: { opacity: 0.4 } }}
      />,
    )
    const rowgroup = container.querySelector('[role="rowgroup"]')
    expect(rowgroup).toHaveStyle({ opacity: '0.4' })
  })

  it('applies classNames.loading to the loading rowgroup', () => {
    const { container } = render(
      <DataGrid
        data={[]}
        columns={columns}
        getRowId={getRowId}
        isLoading
        classNames={{ loading: 'my-loading' }}
      />,
    )
    const rowgroup = container.querySelector('[role="rowgroup"]')
    expect(rowgroup).toHaveClass('my-loading')
  })

  it('applies styles.empty to the empty state', () => {
    const { container } = render(
      <DataGrid
        data={[]}
        columns={columns}
        getRowId={getRowId}
        styles={{ empty: { color: 'rgb(255, 0, 0)' } }}
      />,
    )
    const empty = container.querySelector('.gridkit-empty')
    expect(empty).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  })

  it('applies classNames.empty to the empty state', () => {
    const { container } = render(
      <DataGrid
        data={[]}
        columns={columns}
        getRowId={getRowId}
        classNames={{ empty: 'my-empty' }}
      />,
    )
    expect(container.querySelector('.my-empty')).toBeInTheDocument()
  })

  it('applies classNames.frameInner to the inner frame element', () => {
    const { container } = render(
      <DataGrid
        data={[]}
        columns={columns}
        getRowId={getRowId}
        classNames={{ frameInner: 'my-frame-inner' }}
      />,
    )
    expect(container.querySelector('.gridkit-frame-inner')).toHaveClass('my-frame-inner')
  })

  it('applies styles.frameInner to the inner frame element', () => {
    const { container } = render(
      <DataGrid
        data={[]}
        columns={columns}
        getRowId={getRowId}
        styles={{ frameInner: { borderRadius: '0px' } }}
      />,
    )
    expect(container.querySelector('.gridkit-frame-inner')).toHaveStyle({ borderRadius: '0px' })
  })
})

// ── Card: error inside shell ───────────────────────────────────────────────────

describe('DataGridCard slot contracts', () => {
  it('renders error inside shell (gridkit-shell present)', () => {
    const { container } = render(
      <DataGridCard
        data={[]}
        columns={columns}
        getRowId={getRowId}
        error={ERROR}
        renderCard={(row) => <div>{row.original.label}</div>}
      />,
    )
    expect(screen.getByText('fetch failed')).toBeInTheDocument()
    expect(container.querySelector('.gridkit-shell')).toBeInTheDocument()
  })

  it('applies classNames.error and styles.error to Card error element', () => {
    const { container } = render(
      <DataGridCard
        data={[]}
        columns={columns}
        getRowId={getRowId}
        error={ERROR}
        renderCard={(row) => <div>{row.original.label}</div>}
        classNames={{ error: 'card-error-class' }}
        styles={{ error: { color: 'rgb(255, 0, 0)' } }}
      />,
    )
    const el = container.querySelector('.gridkit-error')
    expect(el).toHaveClass('card-error-class')
    expect(el).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  })

  it('applies classNames.loading and styles.loading to Card loading state', () => {
    const { container } = render(
      <DataGridCard
        data={[]}
        columns={columns}
        getRowId={getRowId}
        isLoading
        renderCard={(row) => <div>{row.original.label}</div>}
        classNames={{ loading: 'card-loading-class' }}
        styles={{ loading: { opacity: 0.5 } }}
      />,
    )
    const grid = container.querySelector('.gridkit-card-grid')
    expect(grid).toHaveClass('card-loading-class')
    expect(grid).toHaveStyle({ opacity: '0.5' })
  })
})

// ── List: error inside shell ───────────────────────────────────────────────────

describe('DataGridList slot contracts', () => {
  it('renders error inside shell (gridkit-shell present)', () => {
    const { container } = render(
      <DataGridList
        data={[]}
        columns={columns}
        getRowId={getRowId}
        error={ERROR}
        renderItem={(row) => <div>{row.original.label}</div>}
      />,
    )
    expect(screen.getByText('fetch failed')).toBeInTheDocument()
    expect(container.querySelector('.gridkit-shell')).toBeInTheDocument()
  })

  it('applies classNames.error and styles.error to List error element', () => {
    const { container } = render(
      <DataGridList
        data={[]}
        columns={columns}
        getRowId={getRowId}
        error={ERROR}
        renderItem={(row) => <div>{row.original.label}</div>}
        classNames={{ error: 'list-error-class' }}
        styles={{ error: { color: 'rgb(0, 0, 255)' } }}
      />,
    )
    const el = container.querySelector('.gridkit-error')
    expect(el).toHaveClass('list-error-class')
    expect(el).toHaveStyle({ color: 'rgb(0, 0, 255)' })
  })

  it('applies classNames.loading and styles.loading to List loading state', () => {
    const { container } = render(
      <DataGridList
        data={[]}
        columns={columns}
        getRowId={getRowId}
        isLoading
        renderItem={(row) => <div>{row.original.label}</div>}
        classNames={{ loading: 'list-loading-class' }}
        styles={{ loading: { opacity: 0.3 } }}
      />,
    )
    const list = container.querySelector('.gridkit-list-items')
    expect(list).toHaveClass('list-loading-class')
    expect(list).toHaveStyle({ opacity: '0.3' })
  })
})

// ── AgentChat: styles slots ────────────────────────────────────────────────────

describe('DataGridAgentChat styles slot contracts', () => {
  const events = [
    { id: 'm1', type: 'message' as const, role: 'user' as const,      content: 'Hello' },
    { id: 'm2', type: 'message' as const, role: 'assistant' as const, content: 'Hi there' },
    { id: 't1', type: 'tool_call' as const, name: 'search', input: { q: 'test' }, status: 'complete' as const },
  ]

  it('applies styles.event to each event wrapper', () => {
    const { container } = render(
      <DataGridAgentChat
        events={events}
        styles={{ event: { opacity: 0.8 } }}
      />,
    )
    const eventEls = container.querySelectorAll('.gridkit-agent-chat-event')
    expect(eventEls.length).toBeGreaterThan(0)
    eventEls.forEach((el) => {
      expect(el).toHaveStyle({ opacity: '0.8' })
    })
  })

  it('applies styles.message to message-type events', () => {
    const { container } = render(
      <DataGridAgentChat
        events={events}
        styles={{ message: { fontWeight: 'bold' } }}
      />,
    )
    const messageEls = container.querySelectorAll('.gridkit-agent-chat-event--message')
    expect(messageEls.length).toBeGreaterThan(0)
    messageEls.forEach((el) => {
      expect(el).toHaveStyle({ fontWeight: 'bold' })
    })
  })

  it('applies styles.eventBody to message content divs', () => {
    const { container } = render(
      <DataGridAgentChat
        events={[{ id: 'm1', type: 'message', role: 'user', content: 'Hello' }]}
        styles={{ eventBody: { color: 'rgb(0, 128, 0)' } }}
      />,
    )
    const body = container.querySelector('.gridkit-agent-chat-content')
    expect(body).toHaveStyle({ color: 'rgb(0, 128, 0)' })
  })

  it('applies styles.code to pre elements', () => {
    const { container } = render(
      <DataGridAgentChat
        events={[{ id: 't1', type: 'tool_call', name: 'fn', input: { x: 1 }, status: 'complete' }]}
        styles={{ code: { fontFamily: 'monospace' } }}
      />,
    )
    const pre = container.querySelector('.gridkit-agent-chat-code')
    expect(pre).toHaveStyle({ fontFamily: 'monospace' })
  })

  it('forwards base chat styles (e.g. styles.content) via DataGridChat', () => {
    const { container } = render(
      <DataGridAgentChat
        events={events}
        styles={{ content: { padding: '8px' } }}
      />,
    )
    const content = container.querySelector('.gridkit-chat-messages')
    expect(content).toHaveStyle({ padding: '8px' })
  })
})

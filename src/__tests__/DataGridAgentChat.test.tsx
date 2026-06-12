import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataGridAgentChat } from '@/DataGridAgentChat'
import type { AgentChatAdapter, AgentChatEvent } from '@/types'

describe('DataGridAgentChat', () => {
  it('renders normalized agent events', () => {
    render(
      <DataGridAgentChat
        events={[
          { id: 'u1', type: 'message', role: 'user', content: 'Show revenue' },
          { id: 'a1', type: 'message', role: 'assistant', content: 'Here is the chart.' },
          { id: 't1', type: 'tool_call', name: 'chart.create', input: { series: 'revenue' }, status: 'running' },
        ]}
      />,
    )

    expect(screen.getByText('Show revenue')).toBeInTheDocument()
    expect(screen.getByText('Here is the chart.')).toBeInTheDocument()
    expect(screen.getByText('chart.create')).toBeInTheDocument()
    expect(screen.getByText(/"series": "revenue"/)).toBeInTheDocument()
  })

  it('uses an adapter and artifact renderer for provider-specific input', () => {
    type ProviderMessage = { key: string; kind: 'text' | 'chart'; text?: string; rows?: number[] }

    const adapter: AgentChatAdapter<ProviderMessage[]> = (messages) =>
      messages.map<AgentChatEvent>((message) => {
        if (message.kind === 'chart') {
          return { id: message.key, type: 'artifact', kind: 'chart', data: message.rows ?? [] }
        }

        return { id: message.key, type: 'message', role: 'assistant', content: message.text ?? '' }
      })

    render(
      <DataGridAgentChat
        input={[
          { key: 'm1', kind: 'text', text: 'Done' },
          { key: 'c1', kind: 'chart', rows: [1, 2, 3] },
        ]}
        adapter={adapter}
        renderArtifact={(event) => <div>chart rows: {(event.data as number[]).length}</div>}
      />,
    )

    expect(screen.getByText('Done')).toBeInTheDocument()
    expect(screen.getByText('chart rows: 3')).toBeInTheDocument()
  })

  it('applies event class and style customization hooks', () => {
    render(
      <DataGridAgentChat
        events={[
          { id: 'u1', type: 'message', role: 'user', content: 'Use custom spacing' },
        ]}
        classNames={{ event: 'agent-event', user: 'agent-user' }}
        getEventClassName={(event) => event.id === 'u1' ? 'run-highlight' : undefined}
        getEventStyle={() => ({ maxWidth: 320 })}
      />,
    )

    const event = screen.getByText('Use custom spacing').closest('.dg-agent-chat-event')
    expect(event).toHaveClass('agent-event', 'agent-user', 'run-highlight')
    expect(event).toHaveStyle({ maxWidth: '320px' })
  })
})

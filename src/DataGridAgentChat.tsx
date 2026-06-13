import { useMemo } from 'react'
import type { AgentChatAdapter, AgentChatEvent, AgentChatRenderContext, DataGridAgentChatProps, DataGridAgentChatStyles, DataGridColumnDef } from '@/types'
import { DataGridChat } from '@/DataGridChat'
import { cn } from '@/lib/utils'

function resolveAdapterEvents<TInput, TEvent extends AgentChatEvent>(
  input: TInput | undefined,
  adapter: AgentChatAdapter<TInput, TEvent> | undefined,
) {
  if (input === undefined || !adapter) return undefined
  return typeof adapter === 'function' ? adapter(input) : adapter.toEvents(input)
}

function stringifySearchValue(value: unknown) {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

const defaultColumns: DataGridColumnDef<AgentChatEvent>[] = [
  {
    id: 'type',
    accessorFn: (event) => event.type,
  },
  {
    id: 'role',
    accessorFn: (event) => (event.type === 'message' ? event.role : ''),
  },
  {
    id: 'status',
    accessorFn: (event) => event.status ?? '',
  },
  {
    id: 'name',
    accessorFn: (event) => ('name' in event ? stringifySearchValue(event.name) : ''),
  },
  {
    id: 'content',
    accessorFn: (event) => ('content' in event ? stringifySearchValue(event.content) : ''),
  },
]

function renderJsonPreview(value: unknown) {
  if (value == null) return null
  if (typeof value === 'string') return value

  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

export function DataGridAgentChat<
  TEvent extends AgentChatEvent = AgentChatEvent,
  TInput = readonly TEvent[],
>(props: DataGridAgentChatProps<TEvent, TInput>) {
  const {
    events,
    input,
    adapter,
    columns,
    getEventId,
    renderEvent,
    renderMessageContent,
    renderToolCall,
    renderToolResult,
    renderArtifact,
    renderStatus,
    renderEventActions,
    classNames,
    styles,
    getEventClassName,
    getEventStyle,
    ...chatProps
  } = props

  const data = useMemo(() => {
    const adaptedEvents = resolveAdapterEvents(input, adapter)
    return [...(adaptedEvents ?? events ?? [])]
  }, [adapter, events, input])

  const resolvedColumns = useMemo(
    () => columns ?? (defaultColumns as DataGridColumnDef<TEvent>[]),
    [columns],
  )

  return (
    <DataGridChat
      {...chatProps}
      styles={styles}
      classNames={{
        ...classNames,
        frame: cn('gridkit-agent-chat-frame', classNames?.frame),
        messageWrapper: cn('gridkit-agent-chat-event-wrapper', classNames?.messageWrapper),
      }}
      data={data}
      columns={resolvedColumns}
      getRowId={(event, index) => getEventId?.(event, index) ?? event.id}
      renderMessage={(row) => {
        const event = row.original
        const context: AgentChatRenderContext<TEvent> = { row, event }
        const customEvent = renderEvent?.(event, context)

        if (customEvent != null) {
          return customEvent
        }

        const actions = renderEventActions?.(event, context)
        const eventClassName = getEventClassName?.(event, context)
        const eventStyle = getEventStyle?.(event, context)

        return (
          <div
            className={cn(
              'gridkit-agent-chat-event',
              `gridkit-agent-chat-event--${event.type}`,
              classNames?.event,
              resolveEventClassName(event, classNames),
              eventClassName,
            )}
            style={{ ...styles?.event, ...resolveEventStyle(event, styles), ...eventStyle }}
            data-event-type={event.type}
            data-status={event.status}
            data-role={event.type === 'message' ? event.role : undefined}
          >
            {renderDefaultEvent(event, context, {
              renderMessageContent,
              renderToolCall,
              renderToolResult,
              renderArtifact,
              renderStatus,
              classNames,
              styles,
            })}
            {actions && <div className={cn('gridkit-agent-chat-actions', classNames?.actions)} style={styles?.actions}>{actions}</div>}
          </div>
        )
      }}
    />
  )
}

function resolveEventClassName<TEvent extends AgentChatEvent>(
  event: TEvent,
  classNames: DataGridAgentChatProps<TEvent>['classNames'],
) {
  if (!classNames) return undefined

  if (event.type === 'message') {
    const roleClassName = classNames[(event as Extract<TEvent, { type: 'message' }>).role]
    return cn(classNames.message, roleClassName)
  }

  if (event.type === 'tool_call') return classNames.toolCall
  if (event.type === 'tool_result') return classNames.toolResult
  if (event.type === 'artifact') return classNames.artifact
  if (event.type === 'status') return classNames.status
  return undefined
}

function resolveEventStyle<TEvent extends AgentChatEvent>(
  event: TEvent,
  styles: DataGridAgentChatStyles | undefined,
): React.CSSProperties | undefined {
  if (!styles) return undefined

  if (event.type === 'message') {
    const role = (event as Extract<TEvent, { type: 'message' }>).role
    const roleStyle = styles[role as keyof DataGridAgentChatStyles] as React.CSSProperties | undefined
    return { ...styles.message, ...roleStyle }
  }

  if (event.type === 'tool_call') return styles.toolCall
  if (event.type === 'tool_result') return styles.toolResult
  if (event.type === 'artifact') return styles.artifact
  if (event.type === 'status') return styles.status
  return undefined
}

function renderDefaultEvent<TEvent extends AgentChatEvent>(
  event: TEvent,
  context: AgentChatRenderContext<TEvent>,
  renderers: Pick<
    DataGridAgentChatProps<TEvent>,
    'renderMessageContent' | 'renderToolCall' | 'renderToolResult' | 'renderArtifact' | 'renderStatus'
  > & Pick<DataGridAgentChatProps<TEvent>, 'classNames'> & { styles?: DataGridAgentChatStyles },
) {
  if (event.type === 'message') {
    const message = event as Extract<TEvent, { type: 'message' }>
    const defaultMessage = event as { role: string; content: React.ReactNode }
    const content = renderers.renderMessageContent?.(message, context) ?? defaultMessage.content

    return (
      <>
        <div className={cn('gridkit-agent-chat-label', renderers.classNames?.label)} style={renderers.styles?.label}>{defaultMessage.role}</div>
        <div className={cn('gridkit-agent-chat-content', renderers.classNames?.eventBody)} style={renderers.styles?.eventBody}>{content}</div>
      </>
    )
  }

  if (event.type === 'tool_call') {
    const toolCall = event as Extract<TEvent, { type: 'tool_call' }>
    const defaultToolCall = event as { name: string; input?: unknown }
    const custom = renderers.renderToolCall?.(toolCall, context)

    return custom ?? (
      <div className="gridkit-agent-chat-tool">
        <div className={cn('gridkit-agent-chat-label', renderers.classNames?.label)} style={renderers.styles?.label}>{defaultToolCall.name}</div>
        <pre className={cn('gridkit-agent-chat-code', renderers.classNames?.code)} style={renderers.styles?.code}>{renderJsonPreview(defaultToolCall.input)}</pre>
      </div>
    )
  }

  if (event.type === 'tool_result') {
    const toolResult = event as Extract<TEvent, { type: 'tool_result' }>
    const defaultToolResult = event as { name: string; output: unknown }
    const custom = renderers.renderToolResult?.(toolResult, context)

    return custom ?? (
      <div className="gridkit-agent-chat-tool">
        <div className={cn('gridkit-agent-chat-label', renderers.classNames?.label)} style={renderers.styles?.label}>{defaultToolResult.name}</div>
        <pre className={cn('gridkit-agent-chat-code', renderers.classNames?.code)} style={renderers.styles?.code}>{renderJsonPreview(defaultToolResult.output)}</pre>
      </div>
    )
  }

  if (event.type === 'artifact') {
    const artifact = event as Extract<TEvent, { type: 'artifact' }>
    const defaultArtifact = event as { kind: string; data: unknown; title?: React.ReactNode }
    const custom = renderers.renderArtifact?.(artifact, context)

    return custom ?? (
      <div className="gridkit-agent-chat-artifact">
        <div className={cn('gridkit-agent-chat-label', renderers.classNames?.label)} style={renderers.styles?.label}>{defaultArtifact.title ?? defaultArtifact.kind}</div>
        <pre className={cn('gridkit-agent-chat-code', renderers.classNames?.code)} style={renderers.styles?.code}>{renderJsonPreview(defaultArtifact.data)}</pre>
      </div>
    )
  }

  if (event.type === 'status') {
    const status = event as Extract<TEvent, { type: 'status' }>
    const defaultStatus = event as { label?: React.ReactNode; status?: string }
    const custom = renderers.renderStatus?.(status, context)

    return custom ?? (
      <div className="gridkit-agent-chat-status">
        {defaultStatus.label ?? defaultStatus.status ?? 'status'}
      </div>
    )
  }

  return (
    <pre className={cn('gridkit-agent-chat-code', renderers.classNames?.code)} style={renderers.styles?.code}>
      {renderJsonPreview(event)}
    </pre>
  )
}

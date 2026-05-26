import React, { useState } from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DataGridChat } from '@/DataGridChat'
import type { DataGridColumnDef } from '@/types'

interface Message {
  id: string
  body: string
}

const columns: DataGridColumnDef<Message>[] = [
  { accessorKey: 'id' },
  { accessorKey: 'body' },
]

type IOCallback = (entries: IntersectionObserverEntry[], observer: IntersectionObserver) => void

function setupIntersectionObserver() {
  let savedCallback: IOCallback | null = null
  let savedEl: Element | null = null

  class MockIO {
    constructor(cb: IOCallback) {
      savedCallback = cb
    }
    observe = vi.fn((el: Element) => {
      savedEl = el
    })
    disconnect = vi.fn()
    unobserve = vi.fn()
  }

  vi.stubGlobal('IntersectionObserver', MockIO)

  return {
    triggerIntersection: () => {
      if (!savedCallback || !savedEl) return
      savedCallback(
        [{ isIntersecting: true, target: savedEl } as IntersectionObserverEntry],
        {} as IntersectionObserver,
      )
    },
  }
}

function setScrollMetrics(
  element: HTMLElement,
  metrics: { scrollHeight: number; clientHeight: number; scrollTop: number },
) {
  Object.defineProperty(element, 'scrollHeight', {
    get: () => metrics.scrollHeight,
    configurable: true,
  })
  Object.defineProperty(element, 'clientHeight', {
    get: () => metrics.clientHeight,
    configurable: true,
  })
  Object.defineProperty(element, 'scrollTop', {
    get: () => metrics.scrollTop,
    set: (value: number) => {
      metrics.scrollTop = value
    },
    configurable: true,
  })
}

function makeMessages(start: number, count: number) {
  return Array.from({ length: count }, (_, index) => {
    const id = String(start + index)
    return { id, body: `Message ${id}` }
  })
}

describe('DataGridChat fill props', () => {
  it('applies dg-table-wrapper--fill when fillContainer is set', () => {
    const { container } = render(
      <DataGridChat
        data={makeMessages(0, 5)}
        columns={columns}
        getRowId={(m) => m.id}
        fillContainer
        renderMessage={(row) => <div>{row.original.body}</div>}
      />,
    )
    expect(container.querySelector('.dg-chat-container')).toHaveClass('dg-table-wrapper--fill')
  })

  it('sets data-fill-parent when fillParent is set', () => {
    const { container } = render(
      <DataGridChat
        data={makeMessages(0, 5)}
        columns={columns}
        getRowId={(m) => m.id}
        fillParent
        renderMessage={(row) => <div>{row.original.body}</div>}
      />,
    )
    expect(container.querySelector('.dg-shell')).toHaveAttribute('data-fill-parent', 'true')
  })
})

describe('DataGridChat scroll behavior', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('preserves scroll offset when older messages are prepended', () => {
    const { triggerIntersection } = setupIntersectionObserver()
    const metrics = { scrollHeight: 1000, clientHeight: 300, scrollTop: 200 }

    function Harness() {
      const [messages, setMessages] = useState(() => makeMessages(10, 4))

      return (
        <DataGridChat
          data={messages}
          columns={columns}
          getRowId={(message) => message.id}
          containerHeight={300}
          hasPreviousPage
          fetchPreviousPage={() => {
            metrics.scrollHeight = 1300
            setMessages((current) => [...makeMessages(6, 4), ...current])
          }}
          renderMessage={(row) => <div>{row.original.body}</div>}
        />
      )
    }

    const { container } = render(<Harness />)
    const chatContainer = container.querySelector('.dg-chat-container') as HTMLElement
    setScrollMetrics(chatContainer, metrics)

    act(() => {
      fireEvent.scroll(chatContainer)
      triggerIntersection()
    })

    expect(screen.getByText('Message 6')).toBeInTheDocument()
    expect(metrics.scrollTop).toBe(500)
  })

  it('sticks to bottom when a new message is appended while at bottom', () => {
    const metrics = { scrollHeight: 600, clientHeight: 300, scrollTop: 300 }

    function Harness() {
      const [messages, setMessages] = useState(() => makeMessages(1, 3))

      return (
        <>
          <button
            onClick={() => {
              metrics.scrollHeight = 720
              setMessages((current) => [...current, { id: '4', body: 'Message 4' }])
            }}
          >
            append
          </button>
          <DataGridChat
            data={messages}
            columns={columns}
            getRowId={(message) => message.id}
            containerHeight={300}
            renderMessage={(row) => <div>{row.original.body}</div>}
          />
        </>
      )
    }

    const { container } = render(<Harness />)
    const chatContainer = container.querySelector('.dg-chat-container') as HTMLElement
    setScrollMetrics(chatContainer, metrics)

    act(() => {
      fireEvent.scroll(chatContainer)
      fireEvent.click(screen.getByText('append'))
    })

    expect(screen.getByText('Message 4')).toBeInTheDocument()
    expect(metrics.scrollTop).toBe(720)
  })

  it('does not stick to bottom when a new message is appended after the user scrolls up', () => {
    const metrics = { scrollHeight: 600, clientHeight: 300, scrollTop: 0 }

    function Harness() {
      const [messages, setMessages] = useState(() => makeMessages(1, 3))

      return (
        <>
          <button
            onClick={() => {
              metrics.scrollHeight = 720
              setMessages((current) => [...current, { id: '4', body: 'Message 4' }])
            }}
          >
            append
          </button>
          <DataGridChat
            data={messages}
            columns={columns}
            getRowId={(message) => message.id}
            containerHeight={300}
            renderMessage={(row) => <div>{row.original.body}</div>}
          />
        </>
      )
    }

    const { container } = render(<Harness />)
    const chatContainer = container.querySelector('.dg-chat-container') as HTMLElement
    setScrollMetrics(chatContainer, metrics)

    act(() => {
      fireEvent.scroll(chatContainer)
      fireEvent.click(screen.getByText('append'))
    })

    expect(screen.getByText('Message 4')).toBeInTheDocument()
    expect(metrics.scrollTop).toBe(0)
  })
})

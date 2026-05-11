import { useMemo, useState } from 'react'
import { DataGridChat, GlobalSearch } from '@loykin/gridkit'
import type { DataGridColumnDef } from '@loykin/gridkit'

interface Message {
  id: string
  author: 'Mina' | 'Joon' | 'System'
  body: string
  createdAt: string
  day: string
  mine: boolean
  unread?: boolean
}

const AUTHORS: Message['author'][] = ['Mina', 'Joon', 'System']
const BODIES = [
  'Can you check the latest deploy status?',
  'The review queue is clear now.',
  'I added the missing trace metadata.',
  'The next batch should arrive in a few seconds.',
  'Looks good from my side.',
  'One warning still needs a follow-up.',
]

function createMessage(index: number): Message {
  const author = AUTHORS[index % AUTHORS.length]!
  const day = index < 18 ? '2026-05-10' : '2026-05-11'
  return {
    id: String(index),
    author,
    body: BODIES[index % BODIES.length]!,
    createdAt: `${String(9 + Math.floor(index / 6)).padStart(2, '0')}:${String((index * 7) % 60).padStart(2, '0')}`,
    day,
    mine: author === 'Mina',
    unread: index === 24,
  }
}

const ALL_MESSAGES = Array.from({ length: 42 }, (_, i) => createMessage(i + 1))

const columns: DataGridColumnDef<Message>[] = [
  { accessorKey: 'author', meta: { filterType: 'select' } },
  { accessorKey: 'body' },
  { accessorKey: 'createdAt' },
  { accessorKey: 'day' },
]

export function ChatTab() {
  const [start, setStart] = useState(22)
  const [messages, setMessages] = useState(() => ALL_MESSAGES.slice(22))
  const [isFetchingPrevious, setIsFetchingPrevious] = useState(false)
  const [nextId, setNextId] = useState(100)
  const hasPreviousPage = start > 0

  const fetchPreviousPage = () => {
    if (isFetchingPrevious || !hasPreviousPage) return
    setIsFetchingPrevious(true)
    setTimeout(() => {
      setStart((current) => {
        const nextStart = Math.max(0, current - 8)
        setMessages(ALL_MESSAGES.slice(nextStart))
        return nextStart
      })
      setIsFetchingPrevious(false)
    }, 400)
  }

  const appendMessage = () => {
    setNextId((id) => {
      const next = {
        ...createMessage(id),
        id: String(id),
        day: '2026-05-11',
        createdAt: new Date().toISOString().slice(11, 16),
      }
      setMessages((prev) => [...prev, next])
      return id + 1
    })
  }

  const loadedLabel = useMemo(
    () => `${messages.length} / ${ALL_MESSAGES.length + nextId - 100}`,
    [messages.length, nextId],
  )

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <p className="text-xs text-muted-foreground">
          Reverse loading with preserved scroll offset and bottom stickiness ({loadedLabel})
        </p>
        <button
          onClick={appendMessage}
          className="ml-auto rounded border border-border px-3 py-1 text-xs hover:bg-muted"
        >
          Append message
        </button>
      </div>

      <DataGridChat
        data={messages}
        columns={columns}
        getRowId={(message) => message.id}
        containerHeight={560}
        searchableColumns={['author', 'body']}
        hasPreviousPage={hasPreviousPage}
        isFetchingPreviousPage={isFetchingPrevious}
        fetchPreviousPage={fetchPreviousPage}
        headerRight={(table) => <GlobalSearch table={table} placeholder="Search messages..." />}
        renderDaySeparator={(row, previousRow) => {
          if (previousRow?.original.day === row.original.day) return null
          return (
            <div className="flex items-center justify-center py-2 text-[11px] text-muted-foreground">
              <span className="rounded-full bg-muted px-2 py-1">{row.original.day}</span>
            </div>
          )
        }}
        renderUnreadMarker={(row) =>
          row.original.unread ? (
            <div className="flex items-center gap-2 py-1 text-[11px] font-medium text-primary">
              <span className="h-px flex-1 bg-primary/40" />
              New
              <span className="h-px flex-1 bg-primary/40" />
            </div>
          ) : null
        }
        renderTypingIndicator={() => (
          <div className="w-fit rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Joon is typing...
          </div>
        )}
        renderMessage={(row) => {
          const message = row.original
          return (
            <div className={`flex ${message.mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[72%] rounded-lg px-3 py-2 text-sm ${
                  message.mine
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-foreground'
                }`}
              >
                <div className="mb-1 flex items-center gap-2 text-[11px] opacity-75">
                  <span>{message.author}</span>
                  <span>{message.createdAt}</span>
                </div>
                <p>{message.body}</p>
              </div>
            </div>
          )
        }}
      />
    </section>
  )
}

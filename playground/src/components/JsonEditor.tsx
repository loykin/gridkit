import { useEffect, useRef, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { json } from '@codemirror/lang-json'
import { oneDark } from '@codemirror/theme-one-dark'

interface JsonEditorProps {
  value: string
  height?: number
  readOnly?: boolean
  onChange?: (value: string) => void
}

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => document.querySelector('.dark') !== null)
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.querySelector('.dark') !== null)
    })
    observer.observe(document.body, { subtree: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])
  return isDark
}

export function JsonEditor({ value, height = 400, readOnly = false, onChange }: JsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const isDark = useDarkMode()

  useEffect(() => {
    if (!containerRef.current) return

    const extensions = [
      basicSetup,
      json(),
      EditorView.theme({ '&': { height: `${height}px` }, '.cm-scroller': { overflow: 'auto' } }),
      ...(isDark ? [oneDark] : []),
      ...(readOnly ? [EditorState.readOnly.of(true)] : []),
      ...(onChange
        ? [EditorView.updateListener.of((update) => {
            if (update.docChanged) onChange(update.state.doc.toString())
          })]
        : []),
    ]

    const view = new EditorView({
      state: EditorState.create({ doc: value, extensions }),
      parent: containerRef.current,
    })
    viewRef.current = view

    return () => {
      view.destroy()
      viewRef.current = null
    }
  }, [isDark])

  useEffect(() => {
    const view = viewRef.current
    if (!view) return
    const current = view.state.doc.toString()
    if (current !== value) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: value },
      })
    }
  }, [value])

  return <div ref={containerRef} className="overflow-hidden rounded border border-border text-sm" />
}

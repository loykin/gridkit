import { useEffect, useRef, useState } from 'react'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { javascript } from '@codemirror/lang-javascript'
import { oneDark } from '@codemirror/theme-one-dark'

interface CodeBlockProps {
  code: string
  height?: number
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

export function CodeBlock({ code, height }: CodeBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const isDark = useDarkMode()

  useEffect(() => {
    if (!containerRef.current) return

    const heightExt = height
      ? EditorView.theme({ '&': { height: `${height}px`, fontSize: '12px' }, '.cm-scroller': { overflow: 'auto' } })
      : EditorView.theme({ '&': { fontSize: '12px' }, '.cm-scroller': { overflow: 'auto' } })

    const view = new EditorView({
      state: EditorState.create({
        doc: code,
        extensions: [
          basicSetup,
          javascript({ typescript: true }),
          heightExt,
          EditorState.readOnly.of(true),
          ...(isDark ? [oneDark] : []),
        ],
      }),
      parent: containerRef.current,
    })

    return () => view.destroy()
  }, [isDark, code, height])

  return <div ref={containerRef} className="overflow-hidden rounded border border-border text-sm" />
}

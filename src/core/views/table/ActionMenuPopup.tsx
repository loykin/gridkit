import React, { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

interface ActionMenuPopupProps {
  anchor: HTMLElement
  onClose: () => void
  children: React.ReactNode
}

export function ActionMenuPopup({ anchor, onClose, children }: ActionMenuPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<React.CSSProperties>({ visibility: 'hidden' })

  useEffect(() => {
    const r = anchor.getBoundingClientRect()
    setPos({
      visibility: 'visible',
      top: r.bottom + 4,
      right: window.innerWidth - r.right,
    })
  }, [anchor])

  useEffect(() => {
    const firstItem = popupRef.current?.querySelector<HTMLElement>('[role="menuitem"]:not(:disabled)')
    firstItem?.focus({ preventScroll: true })
  }, [])

  useEffect(() => {
    const handlePointerDown = (e: MouseEvent) => {
      if (!popupRef.current?.contains(e.target as Node) && !anchor.contains(e.target as Node)) {
        onClose()
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
        anchor.focus()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handlePointerDown)
      document.addEventListener('keydown', handleKeyDown)
    }, 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [anchor, onClose])

  return createPortal(
    <div
      ref={popupRef}
      role="menu"
      className="dg-action-menu"
      style={{ position: 'fixed', zIndex: 50, outline: 'none', ...pos }}
    >
      {children}
    </div>,
    document.body,
  )
}

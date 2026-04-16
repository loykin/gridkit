import { useCallback, useRef, useState } from 'react'

export function useActionMenu<T>() {
  const [open, setOpen] = useState(false)
  const [activeRow, setActiveRow] = useState<T | null>(null)
  const anchorRef = useRef<{ getBoundingClientRect: () => DOMRect } | null>(null)

  const trigger = useCallback((row: T, el: HTMLElement) => {
    const rect = el.getBoundingClientRect()
    anchorRef.current = { getBoundingClientRect: () => rect }
    setActiveRow(row)
    setOpen(true)
  }, [])

  return { open, setOpen, activeRow, anchorRef, trigger }
}

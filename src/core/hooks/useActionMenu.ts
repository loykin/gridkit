import { useCallback, useRef, useState } from 'react'

export function useActionMenu<T>() {
  const [open, setOpen] = useState(false)
  const [activeRow, setActiveRow] = useState<T | null>(null)
  const anchorRef = useRef<HTMLElement | null>(null)

  const trigger = useCallback((row: T, el: HTMLElement) => {
    anchorRef.current = el
    setActiveRow(row)
    setOpen(true)
  }, [])

  return { open, setOpen, activeRow, anchorRef, trigger }
}

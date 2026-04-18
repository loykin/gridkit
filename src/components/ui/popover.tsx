import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

// ── Context ────────────────────────────────────────────────────────────────────

interface PopoverCtx {
  open: boolean
  setOpen: (v: boolean) => void
  triggerRef: React.RefObject<HTMLElement | null>
}

const Ctx = createContext<PopoverCtx | null>(null)

function useCtx() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('Popover used outside <Popover>')
  return ctx
}

// ── Root ───────────────────────────────────────────────────────────────────────

interface PopoverProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Popover({ open: controlled, onOpenChange, children }: PopoverProps) {
  const [internal, setInternal] = useState(false)
  const triggerRef = useRef<HTMLElement>(null)

  const open = controlled !== undefined ? controlled : internal
  const setOpen = useCallback(
    (v: boolean) => {
      if (controlled === undefined) setInternal(v)
      onOpenChange?.(v)
    },
    [controlled, onOpenChange],
  )

  return <Ctx value={{ open, setOpen, triggerRef }}>{children}</Ctx>
}

// ── Trigger ────────────────────────────────────────────────────────────────────

type TriggerRenderProps = React.HTMLAttributes<HTMLElement> & {
  ref: React.Ref<HTMLElement>
  'aria-expanded': boolean
}

interface PopoverTriggerProps {
  render?: (props: TriggerRenderProps) => React.ReactElement
  children?: React.ReactNode
  className?: string
}

export function PopoverTrigger({ render, children, className }: PopoverTriggerProps) {
  const { open, setOpen, triggerRef } = useCtx()

  const triggerProps: TriggerRenderProps = {
    ref: triggerRef as React.Ref<HTMLElement>,
    'aria-expanded': open,
    onClick: (e: React.MouseEvent) => {
      e.stopPropagation()
      setOpen(!open)
    },
  }

  if (render) return render(triggerProps)

  return (
    <button type="button" {...triggerProps} className={cn('dg-btn', className)}>
      {children}
    </button>
  )
}

// ── Content ────────────────────────────────────────────────────────────────────

interface PopoverContentProps {
  children: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
  alignOffset?: number
  sideOffset?: number
  className?: string
  style?: React.CSSProperties
}

export function PopoverContent({
  children,
  side = 'bottom',
  align = 'center',
  sideOffset = 4,
  className,
  style,
}: PopoverContentProps) {
  const { open, setOpen, triggerRef } = useCtx()
  const popupRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<React.CSSProperties>({ visibility: 'hidden' })

  // Position relative to trigger
  useEffect(() => {
    if (!open || !triggerRef.current) return

    const update = () => {
      const r = triggerRef.current!.getBoundingClientRect()
      const next: React.CSSProperties = { visibility: 'visible' }

      if (side === 'bottom') next.top = r.bottom + sideOffset
      else if (side === 'top') next.bottom = window.innerHeight - r.top + sideOffset
      else if (side === 'left') next.right = window.innerWidth - r.left + sideOffset
      else next.left = r.right + sideOffset

      if (side === 'bottom' || side === 'top') {
        if (align === 'start') next.left = r.left
        else if (align === 'end') next.right = window.innerWidth - r.right
        else next.left = r.left + r.width / 2 // center — needs translateX(-50%)
      }

      setPos(next)
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, triggerRef, side, align, sideOffset])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handle = (e: MouseEvent) => {
      if (
        !popupRef.current?.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const timer = setTimeout(() => document.addEventListener('mousedown', handle), 0)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handle)
    }
  }, [open, setOpen, triggerRef])

  if (!open) return null

  const isCenter = (side === 'bottom' || side === 'top') && align === 'center'

  return createPortal(
    <div
      ref={popupRef}
      className={cn('dg-popover-content', className)}
      style={{
        position: 'fixed',
        zIndex: 50,
        ...(isCenter && { transform: 'translateX(-50%)' }),
        ...pos,
        ...style,
      }}
    >
      {children}
    </div>,
    document.body,
  )
}

// ── Header / Title / Description (kept for API compat, simplified) ─────────────

export function PopoverHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('dg-popover-header', className)} {...props} />
}

export function PopoverTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return <p className={cn('dg-popover-title', className)} {...props} />
}

export function PopoverDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn('dg-popover-description', className)} {...props} />
}

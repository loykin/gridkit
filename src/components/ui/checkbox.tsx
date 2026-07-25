import React, { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

export interface CheckboxProps {
  checked?: boolean
  indeterminate?: boolean
  onCheckedChange?: (checked: boolean) => void
  className?: string
  disabled?: boolean
  onClick?: React.MouseEventHandler<HTMLElement>
  'aria-label'?: string
}

export function Checkbox({
  checked,
  indeterminate,
  onCheckedChange,
  className,
  disabled,
  onClick,
  'aria-label': ariaLabel,
}: CheckboxProps) {
  const ref = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate ?? false
  }, [indeterminate])

  return (
    <input
      ref={ref}
      type="checkbox"
      aria-label={ariaLabel}
      checked={checked ?? false}
      disabled={disabled}
      onChange={(e) => onCheckedChange?.(e.target.checked)}
      onClick={onClick}
      className={cn('gridkit-checkbox', className)}
    />
  )
}

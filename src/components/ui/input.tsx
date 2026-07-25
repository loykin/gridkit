import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

export type InputProps = ComponentProps<'input'>

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      data-slot="input"
      className={cn('gridkit-input', className)}
      {...props}
    />
  )
}

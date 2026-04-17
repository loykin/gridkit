import * as React from 'react'
import { Input as InputPrimitive } from '@base-ui/react/input'

import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'h-8 w-full min-w-0 rounded-none border border-[var(--dg-input)] bg-transparent px-2.5 py-1 text-xs transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-xs file:font-medium file:text-[var(--dg-foreground)] placeholder:text-[var(--dg-muted-foreground)] focus-visible:border-[var(--dg-ring)] focus-visible:ring-1 focus-visible:ring-[var(--dg-ring)]/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-[var(--dg-input)]/50 disabled:opacity-50 aria-invalid:border-[var(--dg-destructive)] aria-invalid:ring-1 aria-invalid:ring-[var(--dg-destructive)]/20 md:text-xs dark:bg-[var(--dg-input)]/30 dark:disabled:bg-[var(--dg-input)]/80 dark:aria-invalid:border-[var(--dg-destructive)]/50 dark:aria-invalid:ring-[var(--dg-destructive)]/40',
        className,
      )}
      {...props}
    />
  )
}

export { Input }

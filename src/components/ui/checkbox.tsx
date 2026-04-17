'use client'

import { Checkbox as CheckboxPrimitive } from '@base-ui/react/checkbox'
import { Check } from 'lucide-react'

import { cn } from '@/lib/utils'

function Checkbox({ className, ...props }: CheckboxPrimitive.Root.Props) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        'peer relative flex size-4 shrink-0 items-center justify-center rounded-none border border-[var(--dg-input)] transition-colors outline-none group-has-disabled/field:opacity-50 after:absolute after:-inset-x-3 after:-inset-y-2 focus-visible:border-[var(--dg-ring)] focus-visible:ring-1 focus-visible:ring-[var(--dg-ring)]/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-[var(--dg-destructive)] aria-invalid:ring-1 aria-invalid:ring-[var(--dg-destructive)]/20 aria-invalid:aria-checked:border-[var(--dg-primary)] dark:bg-[var(--dg-input)]/30 dark:aria-invalid:border-[var(--dg-destructive)]/50 dark:aria-invalid:ring-[var(--dg-destructive)]/40 data-checked:border-[var(--dg-primary)] data-checked:bg-[var(--dg-primary)] data-checked:text-[var(--dg-primary-foreground)] dark:data-checked:bg-[var(--dg-primary)]',
        className,
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none [&>svg]:size-3.5"
      >
        <Check />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }

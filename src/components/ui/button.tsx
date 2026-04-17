import { Button as ButtonPrimitive } from '@base-ui/react/button'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding text-xs font-medium whitespace-nowrap transition-all outline-none select-none focus-visible:border-[var(--dg-ring)] focus-visible:ring-1 focus-visible:ring-[var(--dg-ring)]/50 active:not-aria-[haspopup]:translate-y-px disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-[var(--dg-destructive)] aria-invalid:ring-1 aria-invalid:ring-[var(--dg-destructive)]/20 dark:aria-invalid:border-[var(--dg-destructive)]/50 dark:aria-invalid:ring-[var(--dg-destructive)]/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: 'bg-[var(--dg-primary)] text-[var(--dg-primary-foreground)] [a]:hover:bg-[var(--dg-primary)]/80',
        outline:
          'border-[var(--dg-border)] bg-[var(--dg-background)] hover:bg-[var(--dg-muted)] hover:text-[var(--dg-foreground)] aria-expanded:bg-[var(--dg-muted)] aria-expanded:text-[var(--dg-foreground)] dark:border-[var(--dg-input)] dark:bg-[var(--dg-input)]/30 dark:hover:bg-[var(--dg-input)]/50',
        secondary:
          'bg-[var(--dg-secondary)] text-[var(--dg-secondary-foreground)] hover:bg-[var(--dg-secondary)]/80 aria-expanded:bg-[var(--dg-secondary)] aria-expanded:text-[var(--dg-secondary-foreground)]',
        ghost:
          'hover:bg-[var(--dg-muted)] hover:text-[var(--dg-foreground)] aria-expanded:bg-[var(--dg-muted)] aria-expanded:text-[var(--dg-foreground)] dark:hover:bg-[var(--dg-muted)]/50',
        destructive:
          'bg-[var(--dg-destructive)]/10 text-[var(--dg-destructive)] hover:bg-[var(--dg-destructive)]/20 focus-visible:border-[var(--dg-destructive)]/40 focus-visible:ring-[var(--dg-destructive)]/20 dark:bg-[var(--dg-destructive)]/20 dark:hover:bg-[var(--dg-destructive)]/30 dark:focus-visible:ring-[var(--dg-destructive)]/40',
        link: 'text-[var(--dg-primary)] underline-offset-4 hover:underline',
      },
      size: {
        default:
          'h-8 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        xs: "h-6 gap-1 rounded-none px-2 text-xs has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-7 gap-1 rounded-none px-2.5 has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 [&_svg:not([class*='size-'])]:size-3.5",
        lg: 'h-9 gap-1.5 px-2.5 has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2',
        icon: 'size-8',
        'icon-xs': "size-6 rounded-none [&_svg:not([class*='size-'])]:size-3",
        'icon-sm': 'size-7 rounded-none',
        'icon-lg': 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

import type {
  ButtonProps,
} from '@/components/ui/button'
import type { BadgeProps } from '@/components/ui/badge'
import type { CheckboxProps } from '@/components/ui/checkbox'
import type { InputProps } from '@/components/ui/input'
import type {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from '@/components/ui/popover'
import type { SelectProps } from '@/components/ui/select'
import { useGridKitUI } from '@/core/UIAdapterContext'

export function GridKitBadge(props: BadgeProps) {
  const { Badge: Component } = useGridKitUI()
  return <Component {...props} />
}

export function Button(props: ButtonProps) {
  const { Button: Component } = useGridKitUI()
  return <Component {...props} />
}

export function Input(props: InputProps) {
  const { Input: Component } = useGridKitUI()
  return <Component {...props} />
}

export function Checkbox(props: CheckboxProps) {
  const { Checkbox: Component } = useGridKitUI()
  return <Component {...props} />
}

export function Select(props: SelectProps) {
  const { Select: Component } = useGridKitUI()
  return <Component {...props} />
}

export function Popover(props: PopoverProps) {
  const { Popover: Component } = useGridKitUI()
  return <Component {...props} />
}

export function PopoverTrigger(props: PopoverTriggerProps) {
  const { PopoverTrigger: Component } = useGridKitUI()
  return <Component {...props} />
}

export function PopoverContent(props: PopoverContentProps) {
  const { PopoverContent: Component } = useGridKitUI()
  return <Component {...props} />
}

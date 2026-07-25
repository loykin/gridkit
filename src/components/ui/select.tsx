import type { SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string | number
  label: React.ReactNode
  disabled?: boolean
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value' | 'defaultValue' | 'children' | 'multiple'> {
  value?: string | number
  defaultValue?: string | number
  options: SelectOption[]
  onValueChange?: (value: string) => void
}

export function Select({
  className,
  value,
  defaultValue,
  options,
  onValueChange,
  ...props
}: SelectProps) {
  return (
    <select
      className={cn('gridkit-select', className)}
      value={value}
      defaultValue={defaultValue}
      onChange={(event) => onValueChange?.(event.target.value)}
      {...props}
    >
      {options.map((option) => (
        <option key={String(option.value)} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

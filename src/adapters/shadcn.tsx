import type { ElementType } from 'react'
import type { BadgeProps } from '@/components/ui/badge'
import type { ButtonProps } from '@/components/ui/button'
import type { CheckboxProps } from '@/components/ui/checkbox'
import type { InputProps } from '@/components/ui/input'
import type {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
  TriggerRenderProps,
} from '@/components/ui/popover'
import type { SelectProps } from '@/components/ui/select'
import type { GridKitUIAdapter, GridKitUIMetrics } from '@/core/UIAdapterContext'

export interface ShadcnAdapterComponents {
  Badge?: ElementType
  Button: ElementType
  Input: ElementType
  Checkbox: ElementType
  Popover: ElementType
  PopoverTrigger: ElementType
  PopoverContent: ElementType
  Select: ElementType
  SelectTrigger: ElementType
  SelectValue: ElementType
  SelectContent: ElementType
  SelectItem: ElementType
}

export interface ShadcnAdapterOptions {
  density?: 'compact' | 'standard' | 'comfortable'
  metrics?: Partial<GridKitUIMetrics>
}

const shadcnMetrics: Record<
  NonNullable<ShadcnAdapterOptions['density']>,
  GridKitUIMetrics
> = {
  compact: {
    headerHeight: 36,
    rowHeight: 32,
    selectionColumnWidth: 44,
    cellPaddingX: 8,
    controlHeight: 32,
    checkboxSize: 16,
    footerHeight: 40,
  },
  standard: {
    headerHeight: 40,
    rowHeight: 40,
    selectionColumnWidth: 48,
    cellPaddingX: 8,
    controlHeight: 36,
    checkboxSize: 16,
    footerHeight: 44,
  },
  comfortable: {
    headerHeight: 48,
    rowHeight: 48,
    selectionColumnWidth: 56,
    cellPaddingX: 12,
    controlHeight: 40,
    checkboxSize: 18,
    footerHeight: 48,
  },
}

const sizeMap: Record<NonNullable<ButtonProps['size']>, string> = {
  default: 'default',
  xs: 'sm',
  sm: 'sm',
  lg: 'lg',
  icon: 'icon',
  'icon-xs': 'icon-sm',
  'icon-sm': 'icon-sm',
  'icon-lg': 'icon-lg',
}

const EMPTY_SELECT_VALUE = '__gridkit_empty__'

export function createShadcnAdapter(
  components: ShadcnAdapterComponents,
  options: ShadcnAdapterOptions = {},
): GridKitUIAdapter {
  const {
    Button: ShadcnButton,
    Badge: ShadcnBadge,
    Input: ShadcnInput,
    Checkbox: ShadcnCheckbox,
    Popover: ShadcnPopover,
    PopoverTrigger: ShadcnPopoverTrigger,
    PopoverContent: ShadcnPopoverContent,
    Select: ShadcnSelect,
    SelectTrigger: ShadcnSelectTrigger,
    SelectValue: ShadcnSelectValue,
    SelectContent: ShadcnSelectContent,
    SelectItem: ShadcnSelectItem,
  } = components

  function Badge(props: BadgeProps) {
    return ShadcnBadge ? <ShadcnBadge {...props} /> : null
  }

  function Button({ size = 'default', ...props }: ButtonProps) {
    return <ShadcnButton size={sizeMap[size]} {...props} />
  }

  function Input(props: InputProps) {
    return <ShadcnInput {...props} />
  }

  function Checkbox({
    checked,
    indeterminate,
    onCheckedChange,
    ...props
  }: CheckboxProps) {
    return (
      <ShadcnCheckbox
        checked={indeterminate ? 'indeterminate' : checked}
        onCheckedChange={(value: boolean | 'indeterminate') => {
          if (value !== 'indeterminate') onCheckedChange?.(value)
        }}
        {...props}
      />
    )
  }

  function Popover(props: PopoverProps) {
    return <ShadcnPopover {...props} />
  }

  function PopoverTrigger({ render, children, className }: PopoverTriggerProps) {
    const triggerProps: TriggerRenderProps = {
      ref: null,
      'aria-expanded': false,
    }

    return (
      <ShadcnPopoverTrigger asChild className={className}>
        {render ? render(triggerProps) : <button type="button">{children}</button>}
      </ShadcnPopoverTrigger>
    )
  }

  function PopoverContent(props: PopoverContentProps) {
    return <ShadcnPopoverContent {...props} />
  }

  function Select({
    value,
    defaultValue,
    options,
    onValueChange,
    className,
    style,
    disabled,
    ...props
  }: SelectProps) {
    return (
      <ShadcnSelect
        value={value == null ? undefined : String(value) || EMPTY_SELECT_VALUE}
        defaultValue={defaultValue == null ? undefined : String(defaultValue) || EMPTY_SELECT_VALUE}
        onValueChange={(nextValue: string) => onValueChange?.(
          nextValue === EMPTY_SELECT_VALUE ? '' : nextValue,
        )}
        disabled={disabled}
      >
        <ShadcnSelectTrigger className={className} style={style} {...props}>
          <ShadcnSelectValue />
        </ShadcnSelectTrigger>
        <ShadcnSelectContent>
          {options.map((option) => (
            <ShadcnSelectItem
              key={String(option.value)}
              value={String(option.value) || EMPTY_SELECT_VALUE}
              disabled={option.disabled}
            >
              {option.label}
            </ShadcnSelectItem>
          ))}
        </ShadcnSelectContent>
      </ShadcnSelect>
    )
  }

  return {
    appearance: {
      className: 'gridkit-theme-shadcn',
      metrics: {
        ...shadcnMetrics[options.density ?? 'standard'],
        ...options.metrics,
      },
    },
    ...(ShadcnBadge ? { Badge } : {}),
    Button,
    Input,
    Checkbox,
    Select,
    Popover,
    PopoverTrigger,
    PopoverContent,
  }
}

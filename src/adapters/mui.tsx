import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
} from 'react'
import type { CSSProperties, MouseEvent, ReactNode } from 'react'
import {
  Button as MaterialButton,
  Checkbox as MaterialCheckbox,
  Chip,
  MenuItem,
  Popover as MaterialPopover,
  Select as MaterialSelect,
  TextField,
  createTheme,
  useTheme,
} from '@mui/material'
import type { Theme } from '@mui/material'
import type { SelectProps as MaterialSelectProps } from '@mui/material/Select'
import type { BadgeProps } from '@/components/ui/badge'
import type { ButtonProps } from '@/components/ui/button'
import type { CheckboxProps } from '@/components/ui/checkbox'
import type { InputProps } from '@/components/ui/input'
import type {
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
} from '@/components/ui/popover'
import type { SelectProps } from '@/components/ui/select'
import { readGridKitVars, sameGridKitVars } from '@/core/utils/readGridKitVars'
import {
  GridKitProvider,
  mergeGridKitMetrics,
  type GridKitUIAdapter,
  type GridKitUIMetrics,
} from '@/core/UIAdapterContext'

export interface MuiDataGridAdapterOptions {
  preset?: 'data-grid'
  density?: 'compact' | 'standard' | 'comfortable'
  /** MUI X-compatible alias for the grid header metric. */
  columnHeaderHeight?: number
  /** MUI X-compatible alias for the grid row metric. */
  rowHeight?: number
  metrics?: Partial<GridKitUIMetrics>
}

export interface MuiTableAdapterOptions {
  preset: 'table'
  /** Matches Material UI Table's size prop. */
  size?: 'small' | 'medium'
  metrics?: Partial<GridKitUIMetrics>
}

export type MuiAdapterOptions =
  | MuiDataGridAdapterOptions
  | MuiTableAdapterOptions

const muiMetrics: Record<
  NonNullable<MuiDataGridAdapterOptions['density']>,
  GridKitUIMetrics
> = {
  compact: {
    headerHeight: 48,
    rowHeight: 40,
    selectionColumnWidth: 56,
    cellPaddingX: 8,
    controlHeight: 32,
    checkboxSize: 20,
    footerHeight: 52,
  },
  standard: {
    headerHeight: 56,
    rowHeight: 52,
    selectionColumnWidth: 64,
    cellPaddingX: 10,
    controlHeight: 40,
    checkboxSize: 24,
    footerHeight: 56,
  },
  comfortable: {
    headerHeight: 64,
    rowHeight: 60,
    selectionColumnWidth: 72,
    cellPaddingX: 16,
    controlHeight: 48,
    checkboxSize: 24,
    footerHeight: 64,
  },
}

const muiTableMetrics: Record<
  NonNullable<MuiTableAdapterOptions['size']>,
  GridKitUIMetrics
> = {
  small: {
    headerHeight: 40,
    rowHeight: 36,
    selectionColumnWidth: 52,
    cellPaddingX: 16,
    controlHeight: 32,
    checkboxSize: 24,
    footerHeight: 52,
  },
  medium: {
    headerHeight: 56,
    rowHeight: 53,
    selectionColumnWidth: 64,
    cellPaddingX: 16,
    controlHeight: 40,
    checkboxSize: 24,
    footerHeight: 56,
  },
}

const buttonVariantMap = {
  default: 'contained',
  outline: 'outlined',
  secondary: 'contained',
  ghost: 'text',
  destructive: 'contained',
  link: 'text',
} as const

function MuiBadge({
  children,
  variant = 'default',
  className,
  style,
  id,
  title,
  onClick,
}: BadgeProps) {
  return (
    <Chip
      component="span"
      label={children}
      className={className}
      style={style}
      id={id}
      title={title}
      onClick={onClick}
      size="small"
      variant={variant === 'outline' ? 'outlined' : 'filled'}
      color={variant === 'destructive' ? 'error' : variant === 'default' ? 'primary' : 'default'}
      sx={{ maxWidth: '100%' }}
    />
  )
}

const MuiButton = forwardRef<HTMLButtonElement, ButtonProps>(function MuiButton({
  variant = 'default',
  size = 'default',
  color: _color,
  ...props
}, ref) {
  const iconOnly = size.startsWith('icon')
  const iconSize = size === 'icon-xs'
    ? 24
    : size === 'icon-sm'
      ? 28
      : size === 'icon-lg'
        ? 36
        : 32
  const materialColor = variant === 'destructive'
    ? 'error'
    : variant === 'secondary'
      ? 'secondary'
      : 'primary'

  return (
    <MaterialButton
      ref={ref}
      variant={buttonVariantMap[variant]}
      size={size === 'lg' || size === 'icon-lg' ? 'large' : size === 'default' || size === 'icon' ? 'medium' : 'small'}
      color={materialColor}
      sx={iconOnly
        ? {
            minWidth: iconSize,
            width: iconSize,
            height: iconSize,
            padding: 0,
          }
        : undefined}
      {...props}
    />
  )
})

const MuiInput = forwardRef<HTMLInputElement, InputProps>(function MuiInput({
  style,
  size: _size,
  color: _color,
  className,
  id,
  name,
  type,
  value,
  defaultValue,
  onChange,
  onBlur,
  onFocus,
  placeholder,
  disabled,
  required,
  autoFocus,
  autoComplete,
  ...htmlInputProps
}, ref) {
  const { width, ...inputStyle } = style ?? {}

  return (
    <TextField
      inputRef={ref}
      variant="outlined"
      size="small"
      id={id}
      name={name}
      type={type}
      value={value}
      defaultValue={defaultValue}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      autoFocus={autoFocus}
      autoComplete={autoComplete}
      style={{ width }}
      sx={{
        '& .MuiInputBase-root': {
          height: 'var(--gridkit-control-height, 40px)',
        },
      }}
      slotProps={{
        htmlInput: {
          ...htmlInputProps,
          className,
          style: inputStyle,
        },
      }}
    />
  )
})

function MuiCheckbox({
  checked,
  indeterminate,
  onCheckedChange,
  'aria-label': ariaLabel,
  ...props
}: CheckboxProps) {
  return (
    <MaterialCheckbox
      checked={checked ?? false}
      indeterminate={indeterminate}
      size="small"
      disableRipple
      sx={{
        padding: 'max(0px, calc((var(--gridkit-checkbox-container-height, var(--gridkit-row-height, 52px)) - var(--gridkit-checkbox-size, 24px)) / 2 - 2px))',
        '& .MuiSvgIcon-root': {
          fontSize: 'var(--gridkit-checkbox-size, 24px)',
        },
      }}
      slotProps={{ input: { 'aria-label': ariaLabel } }}
      onChange={(_event, value) => onCheckedChange?.(value)}
      {...props}
    />
  )
}

function MuiSelect({
  value,
  defaultValue,
  options,
  onValueChange,
  style,
  className,
  disabled,
  id,
  name,
  required,
  title,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  'aria-describedby': ariaDescribedBy,
  color: _color,
  size: _nativeSize,
  ...props
}: SelectProps) {
  const valueProps = value !== undefined
    ? { value }
    : defaultValue !== undefined
      ? { defaultValue }
      : {}
  const {
    multiple: _multiple,
    ...safeProps
  } = props as typeof props & { multiple?: never }
  const forwardedProps = safeProps as unknown as Partial<MaterialSelectProps<string | number>>

  return (
    <MaterialSelect
      {...forwardedProps}
      {...valueProps}
      size="small"
      sx={{ height: 'var(--gridkit-control-height, 40px)' }}
      style={style}
      className={className}
      disabled={disabled}
      id={id}
      name={name}
      required={required}
      title={title}
      aria-label={ariaLabel}
      labelId={ariaLabelledBy}
      aria-describedby={ariaDescribedBy}
      MenuProps={{ disableScrollLock: true }}
      onChange={(event) => onValueChange?.(String(event.target.value))}
    >
      {options.map((option) => (
        <MenuItem key={String(option.value)} value={option.value} disabled={option.disabled}>
          {option.label}
        </MenuItem>
      ))}
    </MaterialSelect>
  )
}

interface MuiPopoverContextValue {
  open: boolean
  setOpen: (open: boolean) => void
  anchorEl: HTMLElement | null
  setAnchorEl: (element: HTMLElement | null) => void
}

const MuiPopoverContext = createContext<MuiPopoverContextValue | null>(null)

function useMuiPopover() {
  const context = useContext(MuiPopoverContext)
  if (!context) throw new Error('MUI GridKit Popover used outside its root')
  return context
}

function MuiPopoverRoot({
  open: controlledOpen,
  onOpenChange,
  children,
}: PopoverProps) {
  const [internalOpen, setInternalOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null)
  const open = controlledOpen ?? internalOpen
  const setOpen = useCallback((next: boolean) => {
    if (controlledOpen === undefined) setInternalOpen(next)
    onOpenChange?.(next)
  }, [controlledOpen, onOpenChange])
  const value = useMemo(
    () => ({ open, setOpen, anchorEl, setAnchorEl }),
    [anchorEl, open, setOpen],
  )

  return (
    <MuiPopoverContext value={value}>
      {children}
    </MuiPopoverContext>
  )
}

function MuiPopoverTrigger({ render, children, className }: PopoverTriggerProps) {
  const { open, setOpen, setAnchorEl } = useMuiPopover()
  const onClick = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
    setAnchorEl(event.currentTarget)
    setOpen(!open)
  }

  if (render) {
    return render({
      ref: setAnchorEl,
      'aria-expanded': open,
      onClick,
      className,
    })
  }

  return (
    <MaterialButton
      ref={setAnchorEl}
      type="button"
      className={className}
      onClick={onClick}
      aria-expanded={open}
    >
      {children}
    </MaterialButton>
  )
}

function MuiPopoverContent({
  children,
  side = 'bottom',
  align = 'center',
  alignOffset = 0,
  sideOffset = 4,
  className,
  style,
}: PopoverContentProps) {
  const { open, setOpen, anchorEl } = useMuiPopover()
  const [themeVars, setThemeVars] = useState<CSSProperties>({})

  useLayoutEffect(() => {
    if (!open || !anchorEl) return
    const next = readGridKitVars(anchorEl)
    setThemeVars((current) => sameGridKitVars(current, next) ? current : next)
  }, [anchorEl, open])

  const crossOrigin: 'left' | 'right' | 'center' =
    align === 'start' ? 'left' : align === 'end' ? 'right' : 'center'
  const verticalCrossOrigin: 'top' | 'bottom' | 'center' =
    align === 'start' ? 'top' : align === 'end' ? 'bottom' : 'center'
  const anchorOrigin = side === 'top'
    ? { vertical: 'top' as const, horizontal: crossOrigin }
    : side === 'bottom'
      ? { vertical: 'bottom' as const, horizontal: crossOrigin }
      : side === 'left'
        ? { vertical: verticalCrossOrigin, horizontal: 'left' as const }
        : { vertical: verticalCrossOrigin, horizontal: 'right' as const }
  const transformOrigin = side === 'top'
    ? { vertical: 'bottom' as const, horizontal: crossOrigin }
    : side === 'bottom'
      ? { vertical: 'top' as const, horizontal: crossOrigin }
      : side === 'left'
        ? { vertical: verticalCrossOrigin, horizontal: 'right' as const }
        : { vertical: verticalCrossOrigin, horizontal: 'left' as const }
  const offsetStyle: CSSProperties = {
    ...(side === 'bottom' ? { marginTop: sideOffset } : {}),
    ...(side === 'top' ? { marginBottom: sideOffset } : {}),
    ...(side === 'left' ? { marginRight: sideOffset } : {}),
    ...(side === 'right' ? { marginLeft: sideOffset } : {}),
    ...((side === 'top' || side === 'bottom')
      ? { translate: `${alignOffset}px 0` }
      : { translate: `0 ${alignOffset}px` }),
  }

  return (
    <MaterialPopover
      open={open && Boolean(anchorEl)}
      anchorEl={anchorEl}
      disableScrollLock
      onClose={() => setOpen(false)}
      anchorOrigin={anchorOrigin}
      transformOrigin={transformOrigin}
      slotProps={{
        paper: {
          className,
          style: { ...themeVars, ...offsetStyle, ...style },
        },
      }}
    >
      {children as ReactNode}
    </MaterialPopover>
  )
}

type GridKitThemeStyle = CSSProperties & Record<`--${string}`, string | number>

export function createMuiAdapter(
  theme: Theme = createTheme(),
  options: MuiAdapterOptions = {},
): GridKitUIAdapter {
  const preset = options.preset ?? 'data-grid'
  let metrics: GridKitUIMetrics
  let compatibleMetricOverrides: Partial<GridKitUIMetrics> = {}
  if (options.preset === 'table') {
    metrics = muiTableMetrics[options.size ?? 'medium']
  } else {
    metrics = muiMetrics[options.density ?? 'standard']
    compatibleMetricOverrides = {
      ...(options.columnHeaderHeight != null
        ? { headerHeight: options.columnHeaderHeight }
        : {}),
      ...(options.rowHeight != null ? { rowHeight: options.rowHeight } : {}),
    }
  }
  const borderRadius = theme.shape.borderRadius
  const style: GridKitThemeStyle = {
    '--gridkit-background': theme.palette.background.paper,
    '--gridkit-foreground': theme.palette.text.primary,
    '--gridkit-popover': theme.palette.background.paper,
    '--gridkit-popover-foreground': theme.palette.text.primary,
    '--gridkit-primary': theme.palette.primary.main,
    '--gridkit-primary-foreground': theme.palette.primary.contrastText,
    '--gridkit-secondary': theme.palette.action.selected,
    '--gridkit-secondary-foreground': theme.palette.text.primary,
    '--gridkit-muted': theme.palette.action.hover,
    '--gridkit-muted-foreground': theme.palette.text.secondary,
    '--gridkit-accent': theme.palette.action.hover,
    '--gridkit-accent-foreground': theme.palette.text.primary,
    '--gridkit-destructive': theme.palette.error.main,
    '--gridkit-border': theme.palette.divider,
    '--gridkit-input': theme.palette.divider,
    '--gridkit-ring': theme.palette.primary.main,
    '--gridkit-radius': typeof borderRadius === 'number'
      ? `${borderRadius}px`
      : String(borderRadius),
    '--gridkit-theme-frame-shadow': theme.shadows[1],
    fontFamily: theme.typography.fontFamily,
  }

  return {
    appearance: {
      className: `gridkit-theme-mui gridkit-theme-mui-${preset}`,
      style,
      metrics: mergeGridKitMetrics(
        metrics,
        compatibleMetricOverrides,
        options.metrics,
      ) as GridKitUIMetrics,
    },
    Badge: MuiBadge,
    Button: MuiButton,
    Input: MuiInput,
    Checkbox: MuiCheckbox,
    Select: MuiSelect,
    Popover: MuiPopoverRoot,
    PopoverTrigger: MuiPopoverTrigger,
    PopoverContent: MuiPopoverContent,
  }
}

export const muiAdapter = createMuiAdapter()

export type MuiGridKitProviderProps = MuiAdapterOptions & {
  children: ReactNode
}

export function MuiGridKitProvider({
  children,
  ...options
}: MuiGridKitProviderProps) {
  const theme = useTheme()
  const {
    preset,
    metrics,
  } = options
  const cellPaddingX = metrics?.cellPaddingX
  const checkboxSize = metrics?.checkboxSize
  const controlHeight = metrics?.controlHeight
  const footerHeight = metrics?.footerHeight
  const headerHeight = metrics?.headerHeight
  const metricRowHeight = metrics?.rowHeight
  const selectionColumnWidth = metrics?.selectionColumnWidth
  const stableMetrics = useMemo(
    () => mergeGridKitMetrics({
      cellPaddingX,
      checkboxSize,
      controlHeight,
      footerHeight,
      headerHeight,
      rowHeight: metricRowHeight,
      selectionColumnWidth,
    }),
    [
      cellPaddingX,
      checkboxSize,
      controlHeight,
      footerHeight,
      headerHeight,
      metricRowHeight,
      selectionColumnWidth,
    ],
  )
  const density = preset !== 'table' ? options.density : undefined
  const columnHeaderHeight = preset !== 'table'
    ? options.columnHeaderHeight
    : undefined
  const rowHeight = preset !== 'table' ? options.rowHeight : undefined
  const size = preset === 'table' ? options.size : undefined
  const adapter = useMemo(
    () => createMuiAdapter(
      theme,
      preset === 'table'
        ? {
            preset: 'table',
            size,
            metrics: stableMetrics,
          }
        : {
            preset: 'data-grid',
            density,
            columnHeaderHeight,
            rowHeight,
            metrics: stableMetrics,
          },
    ),
    [
      columnHeaderHeight,
      density,
      preset,
      rowHeight,
      size,
      stableMetrics,
      theme,
    ],
  )

  return <GridKitProvider adapter={adapter}>{children}</GridKitProvider>
}

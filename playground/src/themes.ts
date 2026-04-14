export interface Theme {
  name: string
  dark?: boolean
  vars: Record<string, string>
}

export const THEMES: Theme[] = [
  {
    name: 'Default',
    vars: {},
  },
  {
    name: 'Dark',
    dark: true,
    vars: {},
  },
  {
    name: 'Blue',
    vars: {
      '--dg-primary':             'oklch(0.546 0.245 262)',
      '--dg-primary-foreground':  'oklch(0.98 0.01 262)',
      '--dg-ring':                'oklch(0.546 0.245 262)',
      '--dg-muted':               'oklch(0.955 0.01 262)',
      '--dg-accent':              'oklch(0.955 0.01 262)',
      '--dg-radius':              '0.375rem',
    },
  },
  {
    name: 'Ocean',
    dark: true,
    vars: {
      '--dg-background':          'oklch(0.18 0.02 240)',
      '--dg-foreground':          'oklch(0.92 0.01 240)',
      '--dg-popover':             'oklch(0.22 0.025 240)',
      '--dg-popover-foreground':  'oklch(0.92 0.01 240)',
      '--dg-primary':             'oklch(0.72 0.18 195)',
      '--dg-primary-foreground':  'oklch(0.15 0.02 195)',
      '--dg-muted':               'oklch(0.24 0.02 240)',
      '--dg-muted-foreground':    'oklch(0.62 0.02 240)',
      '--dg-accent':              'oklch(0.26 0.025 240)',
      '--dg-accent-foreground':   'oklch(0.92 0.01 240)',
      '--dg-border':              'oklch(1 0 0 / 10%)',
      '--dg-input':               'oklch(1 0 0 / 12%)',
      '--dg-ring':                'oklch(0.72 0.18 195)',
      '--dg-radius':              '0.5rem',
    },
  },
  {
    name: 'Forest',
    vars: {
      '--dg-background':          'oklch(0.99 0.005 140)',
      '--dg-foreground':          'oklch(0.2 0.04 140)',
      '--dg-popover':             'oklch(0.99 0.005 140)',
      '--dg-popover-foreground':  'oklch(0.2 0.04 140)',
      '--dg-primary':             'oklch(0.5 0.15 145)',
      '--dg-primary-foreground':  'oklch(0.98 0.01 145)',
      '--dg-secondary':           'oklch(0.94 0.02 145)',
      '--dg-secondary-foreground':'oklch(0.25 0.05 145)',
      '--dg-muted':               'oklch(0.95 0.015 140)',
      '--dg-muted-foreground':    'oklch(0.48 0.04 140)',
      '--dg-accent':              'oklch(0.93 0.025 140)',
      '--dg-accent-foreground':   'oklch(0.2 0.04 140)',
      '--dg-border':              'oklch(0.86 0.025 140)',
      '--dg-input':               'oklch(0.86 0.025 140)',
      '--dg-ring':                'oklch(0.5 0.15 145)',
      '--dg-radius':              '0.25rem',
    },
  },
  {
    name: 'Rose',
    vars: {
      '--dg-primary':             'oklch(0.59 0.22 10)',
      '--dg-primary-foreground':  'oklch(0.98 0.01 10)',
      '--dg-ring':                'oklch(0.59 0.22 10)',
      '--dg-muted':               'oklch(0.96 0.01 10)',
      '--dg-accent':              'oklch(0.96 0.01 10)',
      '--dg-border':              'oklch(0.9 0.015 10)',
      '--dg-radius':              '0.5rem',
    },
  },
  {
    name: 'Warm',
    vars: {
      '--dg-background':          'oklch(0.99 0.01 80)',
      '--dg-foreground':          'oklch(0.22 0.03 60)',
      '--dg-popover':             'oklch(0.99 0.01 80)',
      '--dg-popover-foreground':  'oklch(0.22 0.03 60)',
      '--dg-primary':             'oklch(0.62 0.16 50)',
      '--dg-primary-foreground':  'oklch(0.98 0.01 50)',
      '--dg-secondary':           'oklch(0.94 0.02 80)',
      '--dg-secondary-foreground':'oklch(0.28 0.04 60)',
      '--dg-muted':               'oklch(0.95 0.02 80)',
      '--dg-muted-foreground':    'oklch(0.52 0.04 60)',
      '--dg-accent':              'oklch(0.93 0.025 80)',
      '--dg-accent-foreground':   'oklch(0.22 0.03 60)',
      '--dg-border':              'oklch(0.88 0.025 80)',
      '--dg-input':               'oklch(0.88 0.025 80)',
      '--dg-ring':                'oklch(0.62 0.16 50)',
      '--dg-radius':              '0.375rem',
    },
  },
]

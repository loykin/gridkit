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
      '--gridkit-primary': 'oklch(0.546 0.245 262)',
      '--gridkit-primary-foreground': 'oklch(0.98 0.01 262)',
      '--gridkit-ring': 'oklch(0.546 0.245 262)',
      '--gridkit-muted': 'oklch(0.955 0.01 262)',
      '--gridkit-accent': 'oklch(0.955 0.01 262)',
      '--gridkit-radius': '0.375rem',
    },
  },
  {
    name: 'Ocean',
    dark: true,
    vars: {
      '--gridkit-background': 'oklch(0.18 0.02 240)',
      '--gridkit-foreground': 'oklch(0.92 0.01 240)',
      '--gridkit-popover': 'oklch(0.22 0.025 240)',
      '--gridkit-popover-foreground': 'oklch(0.92 0.01 240)',
      '--gridkit-primary': 'oklch(0.72 0.18 195)',
      '--gridkit-primary-foreground': 'oklch(0.15 0.02 195)',
      '--gridkit-muted': 'oklch(0.24 0.02 240)',
      '--gridkit-muted-foreground': 'oklch(0.62 0.02 240)',
      '--gridkit-accent': 'oklch(0.26 0.025 240)',
      '--gridkit-accent-foreground': 'oklch(0.92 0.01 240)',
      '--gridkit-border': 'oklch(1 0 0 / 10%)',
      '--gridkit-input': 'oklch(1 0 0 / 12%)',
      '--gridkit-ring': 'oklch(0.72 0.18 195)',
      '--gridkit-radius': '0.5rem',
    },
  },
  {
    name: 'Forest',
    vars: {
      '--gridkit-background': 'oklch(0.99 0.005 140)',
      '--gridkit-foreground': 'oklch(0.2 0.04 140)',
      '--gridkit-popover': 'oklch(0.99 0.005 140)',
      '--gridkit-popover-foreground': 'oklch(0.2 0.04 140)',
      '--gridkit-primary': 'oklch(0.5 0.15 145)',
      '--gridkit-primary-foreground': 'oklch(0.98 0.01 145)',
      '--gridkit-secondary': 'oklch(0.94 0.02 145)',
      '--gridkit-secondary-foreground': 'oklch(0.25 0.05 145)',
      '--gridkit-muted': 'oklch(0.95 0.015 140)',
      '--gridkit-muted-foreground': 'oklch(0.48 0.04 140)',
      '--gridkit-accent': 'oklch(0.93 0.025 140)',
      '--gridkit-accent-foreground': 'oklch(0.2 0.04 140)',
      '--gridkit-border': 'oklch(0.86 0.025 140)',
      '--gridkit-input': 'oklch(0.86 0.025 140)',
      '--gridkit-ring': 'oklch(0.5 0.15 145)',
      '--gridkit-radius': '0.25rem',
    },
  },
  {
    name: 'Rose',
    vars: {
      '--gridkit-primary': 'oklch(0.59 0.22 10)',
      '--gridkit-primary-foreground': 'oklch(0.98 0.01 10)',
      '--gridkit-ring': 'oklch(0.59 0.22 10)',
      '--gridkit-muted': 'oklch(0.96 0.01 10)',
      '--gridkit-accent': 'oklch(0.96 0.01 10)',
      '--gridkit-border': 'oklch(0.9 0.015 10)',
      '--gridkit-radius': '0.5rem',
    },
  },
  {
    name: 'Warm',
    vars: {
      '--gridkit-background': 'oklch(0.99 0.01 80)',
      '--gridkit-foreground': 'oklch(0.22 0.03 60)',
      '--gridkit-popover': 'oklch(0.99 0.01 80)',
      '--gridkit-popover-foreground': 'oklch(0.22 0.03 60)',
      '--gridkit-primary': 'oklch(0.62 0.16 50)',
      '--gridkit-primary-foreground': 'oklch(0.98 0.01 50)',
      '--gridkit-secondary': 'oklch(0.94 0.02 80)',
      '--gridkit-secondary-foreground': 'oklch(0.28 0.04 60)',
      '--gridkit-muted': 'oklch(0.95 0.02 80)',
      '--gridkit-muted-foreground': 'oklch(0.52 0.04 60)',
      '--gridkit-accent': 'oklch(0.93 0.025 80)',
      '--gridkit-accent-foreground': 'oklch(0.22 0.03 60)',
      '--gridkit-border': 'oklch(0.88 0.025 80)',
      '--gridkit-input': 'oklch(0.88 0.025 80)',
      '--gridkit-ring': 'oklch(0.62 0.16 50)',
      '--gridkit-radius': '0.375rem',
    },
  },
]

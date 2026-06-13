# Migration Guide — v0.1.x → v0.2.0

v0.2.0 is a breaking release that renames all CSS prefixes and refines the component API.
Follow the steps below to migrate from v0.1.x.

---

## 1. CSS Custom Properties (required)

All `--dg-*` custom properties have been renamed to `--gridkit-*`.

**Who is affected**: Any CSS/SCSS file that overrides GridKit theme tokens directly.

```css
/* v0.1 */
:root {
  --dg-header-background: #0f172a;
  --dg-header-foreground: #f8fafc;
  --dg-border:            #e2e8f0;
  --dg-radius:            0.75rem;
  --dg-primary:           #3b82f6;
}
.dark {
  --dg-background: #0a0a0a;
  --dg-border:     rgba(255, 255, 255, 0.1);
}

/* v0.2 */
:root {
  --gridkit-header-background: #0f172a;
  --gridkit-header-foreground: #f8fafc;
  --gridkit-border:            #e2e8f0;
  --gridkit-radius:            0.75rem;
  --gridkit-primary:           #3b82f6;
}
.dark {
  --gridkit-background: #0a0a0a;
  --gridkit-border:     rgba(255, 255, 255, 0.1);
}
```

### Full variable rename table

| v0.1 | v0.2 |
|------|------|
| `--dg-background` | `--gridkit-background` |
| `--dg-foreground` | `--gridkit-foreground` |
| `--dg-popover` | `--gridkit-popover` |
| `--dg-popover-foreground` | `--gridkit-popover-foreground` |
| `--dg-primary` | `--gridkit-primary` |
| `--dg-primary-foreground` | `--gridkit-primary-foreground` |
| `--dg-secondary` | `--gridkit-secondary` |
| `--dg-secondary-foreground` | `--gridkit-secondary-foreground` |
| `--dg-muted` | `--gridkit-muted` |
| `--dg-muted-foreground` | `--gridkit-muted-foreground` |
| `--dg-header-background` | `--gridkit-header-background` |
| `--dg-header-foreground` | `--gridkit-header-foreground` |
| `--dg-header-border` | `--gridkit-header-border` |
| `--dg-header-control-background` | `--gridkit-header-control-background` |
| `--dg-header-control-foreground` | `--gridkit-header-control-foreground` |
| `--dg-header-control-border` | `--gridkit-header-control-border` |
| `--dg-header-popover-background` | `--gridkit-header-popover-background` |
| `--dg-header-popover-foreground` | `--gridkit-header-popover-foreground` |
| `--dg-header-popover-border` | `--gridkit-header-popover-border` |
| `--dg-footer-background` | `--gridkit-footer-background` |
| `--dg-footer-foreground` | `--gridkit-footer-foreground` |
| `--dg-footer-border` | `--gridkit-footer-border` |
| `--dg-container-border` | `--gridkit-container-border` |
| `--dg-accent` | `--gridkit-accent` |
| `--dg-accent-foreground` | `--gridkit-accent-foreground` |
| `--dg-destructive` | `--gridkit-destructive` |
| `--dg-border` | `--gridkit-border` |
| `--dg-input` | `--gridkit-input` |
| `--dg-control-background` | `--gridkit-control-background` |
| `--dg-control-foreground` | `--gridkit-control-foreground` |
| `--dg-control-border` | `--gridkit-control-border` |
| `--dg-control-placeholder` | `--gridkit-control-placeholder` |
| `--dg-popover-border` | `--gridkit-popover-border` |
| `--dg-popover-option-hover-background` | `--gridkit-popover-option-hover-background` |
| `--dg-popover-section-foreground` | `--gridkit-popover-section-foreground` |
| `--dg-ring` | `--gridkit-ring` |
| `--dg-radius` | `--gridkit-radius` |
| `--dg-scrollbar-size` | `--gridkit-scrollbar-size` |
| `--dg-scrollbar-track` | `--gridkit-scrollbar-track` |
| `--dg-scrollbar-thumb` | `--gridkit-scrollbar-thumb` |

> **shadcn/ui users**: No changes needed. GridKit variables automatically fall back to
> shadcn shared tokens (`--background`, `--border`, `--primary`, etc.).

---

## 2. CSS Class Selectors (if directly targeted)

All internal GridKit classes have been renamed from `.dg-*` to `.gridkit-*`.

**Who is affected**: Consumer stylesheets that target internal GridKit DOM classes directly.

```css
/* v0.1 */
.dg-row:hover   { background: #f0f4ff; }
.dg-cell        { font-size: 13px; }
.dg-header-cell { font-weight: 600; }
.dg-footer      { border-top: 1px solid #e2e8f0; }

/* v0.2 */
.gridkit-row:hover   { background: #f0f4ff; }
.gridkit-cell        { font-size: 13px; }
.gridkit-header-cell { font-weight: 600; }
.gridkit-footer      { border-top: 1px solid #e2e8f0; }
```

> **Recommendation**: Use the `classNames` and `styles` props instead of targeting
> internal class names directly. Internal classes are not part of the public API and
> may change in future releases.

---

## 3. `containerStyle` removed (DataGridChat / DataGridAgentChat)

The `containerStyle` prop has been removed. Use `styles.frame` instead.

```tsx
/* v0.1 */
<DataGridChat
  containerStyle={{ padding: '8px', background: '#0a0a0a' }}
/>

/* v0.2 */
<DataGridChat
  styles={{ frame: { padding: '8px', background: '#0a0a0a' } }}
/>
```

Injecting CSS variables through the container:

```tsx
/* v0.1 */
<DataGridAgentChat
  containerStyle={{ '--dg-background': '#0a0a0a' } as CSSProperties}
/>

/* v0.2 */
<DataGridAgentChat
  styles={{ frame: { '--gridkit-background': '#0a0a0a' } as CSSProperties }}
/>
```

---

## 4. `classNames.container` → `classNames.frame`

The `container` slot has been renamed to `frame`. New slots — `root`, `toolbar`,
`error`, and `loading` — have been added across all views.

The `container` slot maps to different v0.2 slots depending on the view:

**DataGrid (table view)** — `container` styled the inner scroll container, which maps to `content`:

```tsx
/* v0.1 */
<DataGrid classNames={{ container: 'shadow-md' }} />

/* v0.2 */
<DataGrid classNames={{ content: 'shadow-md' }} />
```

**DataGridCard / DataGridList / DataGridChat** — `container` styled the outer scroll frame, which maps to `frame`:

```tsx
/* v0.1 */
<DataGridCard classNames={{ container: 'shadow-md' }} />
<DataGridList classNames={{ container: 'shadow-md' }} />
<DataGridChat classNames={{ container: 'shadow-md' }} />

/* v0.2 */
<DataGridCard classNames={{ frame: 'shadow-md' }} />
<DataGridList classNames={{ frame: 'shadow-md' }} />
<DataGridChat classNames={{ frame: 'shadow-md' }} />
```

### Slot rename table

| v0.1 `classNames` | v0.2 `classNames` | Applies to |
|---|---|---|
| `container` | `content` | DataGrid (table) — inner scroll container |
| `container` | `frame` | Card / List / Chat — outer scroll frame |
| `footer` | `footer` | All — unchanged |
| `header` | `header` | Table only — unchanged |
| `row` | `row` | Table only — unchanged |
| `cell` | `cell` | Table only — unchanged |
| `empty` | `empty` | All — unchanged |
| `loadMore` | `loadMore` | All — unchanged |
| _(none)_ | `root` | All — outermost shell wrapper |
| _(none)_ | `toolbar` | All — toolbar area |
| _(none)_ | `error` | All — error state |
| _(none)_ | `loading` | All — loading skeleton |

The `styles` prop mirrors the same slot structure for inline styles:

```tsx
<DataGrid
  styles={{
    frame:  { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
    row:    { minHeight: 40 },
    empty:  { color: '#6b7280' },
  }}
/>
```

---

## 5. Error state behavior change

When an error occurs, the **toolbar (headerLeft / headerRight) now remains visible**
alongside the error message.

In v0.1, an error caused the entire component to be replaced by the error message,
hiding the toolbar. In v0.2, the error is rendered inside the shell so users can
still interact with filters and search to resolve the error condition.

Use `classNames.error` / `styles.error` to style the error state:

```tsx
<DataGridCard
  classNames={{ error: 'text-sm p-4' }}
  styles={{ error: { color: '#ef4444', background: '#fff1f0' } }}
/>
```

---

## Quick migration script

Handles mechanical renames. **Commit your changes before running.**

```bash
# Rename CSS custom properties
find . -type f \( -name "*.css" -o -name "*.scss" -o -name "*.tsx" -o -name "*.ts" \) \
  -not -path "*/node_modules/*" \
  -exec sed -i '' 's/--dg-/--gridkit-/g' {} +
```

`containerStyle`, CSS class selectors, and `classNames.container` must be updated manually.

# Gridkit — AI Agent Instructions

## Project Overview

- **Package**: `@loykin/gridkit`
- **Description**: Headless React DataGrid library (AG-Grid-like)
- **Stack**: React 19, TanStack Table v8, TanStack Virtual v3, dnd-kit, Zustand, lucide-react
- **Monorepo**: root (library), `examples/`, `playground/` (Vite dev server)

## Commands

```bash
pnpm build         # type-check + lint + tsup + CSS build
pnpm build:js      # tsup only
pnpm build:css     # CSS only
pnpm dev           # watch mode + playground dev server
pnpm type-check    # tsc --noEmit
pnpm lint          # eslint
pnpm test          # vitest run
pnpm test:e2e      # node --test e2e/*.test.mjs
```

## Architecture

### Entry Points
- `src/DataGrid.tsx` — standard grid
- `src/DataGridDrag.tsx` — row drag variant
- `src/DataGridInfinity.tsx` — infinite scroll variant
- `src/DataGridCard.tsx`, `src/DataGridList.tsx`, `src/DataGridChat.tsx` — layout variants
- `src/DataGridAgentChat.tsx` — agent event stream variant (builds on DataGridChat)
- `src/GridKitAutoTable.tsx` — renders `GridKitTablePayload` (LLM-generated JSON) as a DataGrid
- `src/index.ts` — public API exports

### Core Render Tree
```
DataGrid
  → useDataGridBase (src/core/hooks/useDataGridBase.ts)
      → useDataGridCore (src/core/hooks/useDataGridCore.ts)  ← TanStack table state
  → DataGridShell (src/core/DataGridShell.tsx)
      → GridKitShell (src/core/GridKitShell.tsx)
          → DataGridTableView (src/core/views/)
              → DataGridHeaderLayout (src/core/table/DataGridHeaderLayout.tsx)
                  → DataGridHeaderCell (src/core/table/DataGridHeaderCell.tsx)
              → DataGridFilterRow (src/core/table/DataGridFilterRow.tsx)
              → DataGridBody (src/core/table/DataGridBody.tsx)
                  → DataGridBodyRow (src/core/table/DataGridBodyRow.tsx)
                      → DataGridBodyCell (src/core/table/DataGridBodyCell.tsx)
```

### Features (`src/features/`)
| Directory | Feature |
|-----------|---------|
| `editing/` | Inline cell editing (`meta.editCell`, `onCellValueChange`) |
| `expanding/` | Master-detail rows (`renderDetailRow`, `ExpandToggleCell`) |
| `export/` | CSV export (`useCSVExport` hook) |
| `filters/` | Column filters |
| `pinning/` | Dynamic column pinning UI (`enableColumnPinning`) |
| `reordering/` | Column reordering via dnd-kit (`enableColumnReordering`) |
| `resizing/` | Column resizing |
| `selection/` | Row selection |
| `sorting/` | Column sorting |
| `actions/` | Row actions menu |
| `menu/` | Column header menu |

### Key Types & Patterns
- `DataGridBaseProps<T>` — top-level props (extends `TableViewConfig<T>` + data/callbacks)
- `TableViewConfig<T>` — shared view props flowing through all render components via `...viewConfig` spread
- `DataGridColumnDef<T>` — column definition type (wraps TanStack `ColumnDef`)
- `DataGridIcons` interface in `src/types.ts` — icon slot overrides; add new slots here AND in `defaultIcons` in `src/core/IconsContext.tsx`

### Context Providers
- `DetailRowContext` — master-detail expansion state
- `EditingCellContext` — currently editing cell
- `RowDragContext` — row drag state
- `RowWrapperContext` — row-level wrapper injection

### ColumnMeta Extensions
TanStack Table's `ColumnMeta` is augmented in:
- `src/core/engine/tanstack/ColumnFlexFeature.ts` — `flex`, `autoSize`, `align`, `wrap`, `cellOverflow`, etc.
- `src/core/engine/tanstack/ColumnFilterFeature.ts` — `filterType`
- `src/core/engine/tanstack/RowActionsFeature.ts` — `actions`
- `src/core/engine/tanstack/DataStoreFeature.ts` — `applyTransaction`, `getRowNodeById`

## Styling

- All styles in `src/styles/index.css`
- Theme via CSS custom properties (`--gridkit-*`)
- State styling uses `data-*` attributes (e.g. `data-pinned`, `data-editing`, `data-dragging`)
- Key classes: `.gridkit-detail-row`, `.gridkit-cell[data-editing="true"]`

## Conventions

- New icon slots → add to `DataGridIcons` in `src/types.ts` AND `defaultIcons` in `src/core/IconsContext.tsx`
- No unnecessary comments — only add when the WHY is non-obvious

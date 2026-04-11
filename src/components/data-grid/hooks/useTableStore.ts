import { create } from 'zustand'
import type { PaginationState } from '@tanstack/react-table'

interface PersistedTableState {
  pagination: PaginationState
  searchTerm: string
}

interface TableStoreState {
  tables: Record<string, PersistedTableState>
  register: (key: string, initial?: Partial<PersistedTableState>) => void
  update: (key: string, partial: Partial<PersistedTableState>) => void
  reset: (key: string) => void
}

const DEFAULT_STATE: PersistedTableState = {
  pagination: { pageIndex: 0, pageSize: 20 },
  searchTerm: '',
}

export const useTableStore = create<TableStoreState>((set, get) => ({
  tables: {},

  register: (key, initial) => {
    if (get().tables[key]) return // already registered
    set((s) => ({
      tables: {
        ...s.tables,
        [key]: { ...DEFAULT_STATE, ...initial },
      },
    }))
  },

  update: (key, partial) =>
    set((s) => ({
      tables: {
        ...s.tables,
        [key]: { ...(s.tables[key] ?? DEFAULT_STATE), ...partial },
      },
    })),

  reset: (key) =>
    set((s) => ({
      tables: { ...s.tables, [key]: { ...DEFAULT_STATE } },
    })),
}))
